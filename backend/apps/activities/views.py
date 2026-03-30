import django_filters
from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Activity
from .serializers import ActivitySerializer


class ActivityFilter(django_filters.FilterSet):
    activity_type = django_filters.CharFilter(lookup_expr='iexact')
    assigned_to = django_filters.NumberFilter()
    completed = django_filters.BooleanFilter()
    related_lead = django_filters.NumberFilter()
    related_contact = django_filters.NumberFilter()
    related_deal = django_filters.NumberFilter()
    related_company = django_filters.NumberFilter()
    due_after = django_filters.DateFilter(field_name='due_date', lookup_expr='gte')
    due_before = django_filters.DateFilter(field_name='due_date', lookup_expr='lte')
    overdue = django_filters.BooleanFilter(method='filter_overdue')

    class Meta:
        model = Activity
        fields = ['activity_type', 'assigned_to', 'completed']

    def filter_overdue(self, queryset, name, value):
        if value:
            return queryset.filter(due_date__lt=timezone.now(), completed=False)
        return queryset


class ActivityViewSet(viewsets.ModelViewSet):
    serializer_class = ActivitySerializer
    permission_classes = [IsAuthenticated]
    filterset_class = ActivityFilter
    search_fields = ['title', 'description']
    ordering_fields = ['due_date', 'created_at', 'priority']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Activity.objects.filter(is_deleted=False).select_related(
            'assigned_to', 'related_lead', 'related_contact', 'related_deal', 'related_company'
        )
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

    @action(detail=True, methods=['post'], url_path='complete')
    def complete(self, request, pk=None):
        activity = self.get_object()
        activity.completed = True
        activity.completed_at = timezone.now()
        activity.save()
        return Response(self.get_serializer(activity).data)
