from django.contrib import admin
from .models import Pipeline, PipelineStage, Deal, DealStageHistory

admin.site.register(Pipeline)
admin.site.register(PipelineStage)

@admin.register(Deal)
class DealAdmin(admin.ModelAdmin):
    list_display = ['title', 'amount', 'stage', 'status', 'assigned_to', 'expected_close_date']
    list_filter = ['status', 'pipeline', 'deal_type']
    search_fields = ['title']
