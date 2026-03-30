from django.contrib import admin
from .models import Lead

@admin.register(Lead)
class LeadAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'company_name', 'status', 'priority', 'lead_score', 'assigned_to']
    list_filter = ['status', 'priority', 'lead_source', 'converted']
    search_fields = ['first_name', 'last_name', 'email', 'phone', 'company_name']
