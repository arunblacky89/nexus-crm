import django_filters
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db import transaction
from .models import Pipeline, PipelineStage, Deal, DealStageHistory
from .serializers import PipelineSerializer, PipelineStageSerializer, DealSerializer


class PipelineViewSet(viewsets.ModelViewSet):
    queryset = Pipeline.objects.prefetch_related('stages')
    serializer_class = PipelineSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'], url_path='reorder-stages')
    def reorder_stages(self, request, pk=None):
        pipeline = self.get_object()
        stage_orders = request.data.get('stages', [])  # [{'id': 1, 'order': 0}, ...]
        with transaction.atomic():
            for item in stage_orders:
                PipelineStage.objects.filter(id=item['id'], pipeline=pipeline).update(order=item['order'])
        return Response({'detail': 'Stages reordered.'})


class PipelineStageViewSet(viewsets.ModelViewSet):
    queryset = PipelineStage.objects.all()
    serializer_class = PipelineStageSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['pipeline']


class DealFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(lookup_expr='iexact')
    stage = django_filters.NumberFilter()
    pipeline = django_filters.NumberFilter()
    assigned_to = django_filters.NumberFilter()
    company = django_filters.NumberFilter()
    contact = django_filters.NumberFilter()
    deal_type = django_filters.CharFilter(lookup_expr='iexact')
    min_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='gte')
    max_amount = django_filters.NumberFilter(field_name='amount', lookup_expr='lte')
    close_after = django_filters.DateFilter(field_name='expected_close_date', lookup_expr='gte')
    close_before = django_filters.DateFilter(field_name='expected_close_date', lookup_expr='lte')

    class Meta:
        model = Deal
        fields = ['status', 'stage', 'pipeline', 'assigned_to', 'deal_type']


class DealViewSet(viewsets.ModelViewSet):
    serializer_class = DealSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = DealFilter
    search_fields = ['title', 'contact__first_name', 'contact__last_name', 'company__name']
    ordering_fields = ['title', 'amount', 'created_at', 'expected_close_date']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Deal.objects.filter(is_deleted=False).select_related(
            'pipeline', 'stage', 'contact', 'company', 'assigned_to'
        ).prefetch_related('tags', 'stage_history')
        user = self.request.user
        if user.is_admin:
            return qs
        if user.is_manager:
            team_members = user.team.members.all() if user.team else []
            return qs.filter(assigned_to__in=team_members)
        return qs.filter(assigned_to=user)

    def perform_create(self, serializer):
        serializer.save(
            created_by=self.request.user,
            assigned_to=serializer.validated_data.get('assigned_to') or self.request.user
        )

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        obj.is_deleted = True
        obj.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path='move-stage')
    def move_stage(self, request, pk=None):
        deal = self.get_object()
        stage_id = request.data.get('stage_id')
        if not stage_id:
            return Response({'detail': 'stage_id required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            new_stage = PipelineStage.objects.get(id=stage_id)
        except PipelineStage.DoesNotExist:
            return Response({'detail': 'Stage not found.'}, status=status.HTTP_404_NOT_FOUND)

        old_stage = deal.stage
        deal.stage = new_stage

        # Auto-update status on won/lost stages
        status_data = request.data.get('status')
        if status_data:
            deal.status = status_data

        deal.save()

        DealStageHistory.objects.create(
            deal=deal,
            from_stage=old_stage,
            to_stage=new_stage,
            changed_by=request.user,
        )

        serializer = self.get_serializer(deal)
        return Response(serializer.data)
