import django_filters
from .models import Lead


class LeadFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(lookup_expr='iexact')
    priority = django_filters.CharFilter(lookup_expr='iexact')
    lead_source = django_filters.CharFilter(lookup_expr='iexact')
    assigned_to = django_filters.NumberFilter()
    converted = django_filters.BooleanFilter()
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    tags = django_filters.CharFilter(field_name='tags__name', lookup_expr='icontains')
    min_score = django_filters.NumberFilter(field_name='lead_score', lookup_expr='gte')

    class Meta:
        model = Lead
        fields = ['status', 'priority', 'lead_source', 'assigned_to', 'converted']
