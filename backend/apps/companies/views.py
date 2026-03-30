from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Company
from .serializers import CompanySerializer
from .filters import CompanyFilter


class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    filterset_class = CompanyFilter
    search_fields = ['name', 'email', 'phone', 'city', 'industry']
    ordering_fields = ['name', 'created_at', 'annual_revenue']
    ordering = ['-created_at']

    def get_queryset(self):
        qs = Company.objects.filter(is_deleted=False).select_related('assigned_to', 'parent_company')
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

    @action(detail=False, methods=['get'])
    def dropdown(self, request):
        companies = Company.objects.filter(is_deleted=False).values('id', 'uuid', 'name')
        return Response(list(companies))
