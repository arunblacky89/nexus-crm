from django.contrib import admin
from .models import Contact

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'email', 'phone', 'company', 'job_title', 'assigned_to']
    search_fields = ['first_name', 'last_name', 'email', 'phone']
    list_filter = ['company', 'do_not_contact']
