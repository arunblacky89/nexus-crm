from django.contrib import admin
from .models import Activity

@admin.register(Activity)
class ActivityAdmin(admin.ModelAdmin):
    list_display = ['title', 'activity_type', 'assigned_to', 'due_date', 'completed', 'priority']
    list_filter = ['activity_type', 'completed', 'priority']
    search_fields = ['title', 'description']
