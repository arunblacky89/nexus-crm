from django.contrib import admin
from .models import Company

@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'industry', 'company_size', 'city', 'country', 'assigned_to']
    search_fields = ['name', 'email', 'phone']
    list_filter = ['industry', 'company_size', 'country']
