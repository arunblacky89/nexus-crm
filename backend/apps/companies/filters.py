import django_filters
from .models import Company


class CompanyFilter(django_filters.FilterSet):
    industry = django_filters.CharFilter(lookup_expr='iexact')
    company_size = django_filters.CharFilter(lookup_expr='iexact')
    country = django_filters.CharFilter(lookup_expr='icontains')
    assigned_to = django_filters.NumberFilter()
    created_after = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Company
        fields = ['industry', 'company_size', 'country', 'assigned_to']
