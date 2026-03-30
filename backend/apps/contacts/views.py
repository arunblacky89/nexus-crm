from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import django_filters
from .models import Contact
from .serializers import ContactSerializer


class ContactFilter(django_filters.FilterSet):
    assigned_to = django_filters.NumberFilter()
    company = django_filters.NumberFilter()
    country = django_filters.CharFilter(lookup_expr='icontains')
    do_not_contact = django_filters.BooleanFilter()
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Contact
        fields = ['assigned_to', 'company', 'do_not_contact']


class ContactViewSet(viewsets.ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = ContactFilter
    search_fields = ['first_name', 'last_name', 'email', 'phone', 'mobile']
    ordering_fields = ['first_name', 'last_name', 'created_at']
    ordering = ['first_name', 'last_name']

    def get_queryset(self):
        qs = Contact.objects.filter(is_deleted=False).select_related(
            'assigned_to', 'company', 'lead'
        ).prefetch_related('tags')
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
        contacts = Contact.objects.filter(is_deleted=False).values(
            'id', 'uuid', 'first_name', 'last_name', 'email'
        )
        data = [{'id': c['id'], 'uuid': str(c['uuid']), 'name': f"{c['first_name']} {c['last_name']}".strip(), 'email': c['email']} for c in contacts]
        return Response(data)
