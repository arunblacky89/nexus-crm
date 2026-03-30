from rest_framework import serializers
from .models import Pipeline, PipelineStage, Deal, DealStageHistory
from apps.settings_app.serializers import TagSerializer


class PipelineStageSerializer(serializers.ModelSerializer):
    deal_count = serializers.SerializerMethodField()
    deal_value = serializers.SerializerMethodField()

    class Meta:
        model = PipelineStage
        fields = ['id', 'pipeline', 'name', 'order', 'probability', 'color', 'deal_count', 'deal_value']

    def get_deal_count(self, obj):
        return obj.deals.filter(is_deleted=False, status='Open').count()

    def get_deal_value(self, obj):
        from django.db.models import Sum
        result = obj.deals.filter(is_deleted=False, status='Open').aggregate(total=Sum('amount'))
        return float(result['total'] or 0)


class PipelineSerializer(serializers.ModelSerializer):
    stages = PipelineStageSerializer(many=True, read_only=True)

    class Meta:
        model = Pipeline
        fields = ['id', 'name', 'is_default', 'stages', 'created_at']


class DealStageHistorySerializer(serializers.ModelSerializer):
    from_stage_name = serializers.CharField(source='from_stage.name', read_only=True)
    to_stage_name = serializers.CharField(source='to_stage.name', read_only=True)
    changed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = DealStageHistory
        fields = ['id', 'from_stage', 'from_stage_name', 'to_stage', 'to_stage_name',
                  'changed_by', 'changed_by_name', 'changed_at']

    def get_changed_by_name(self, obj):
        if obj.changed_by:
            return obj.changed_by.get_full_name() or obj.changed_by.username
        return None


class DealSerializer(serializers.ModelSerializer):
    stage_name = serializers.CharField(source='stage.name', read_only=True)
    stage_color = serializers.CharField(source='stage.color', read_only=True)
    stage_probability = serializers.IntegerField(source='stage.probability', read_only=True)
    pipeline_name = serializers.CharField(source='pipeline.name', read_only=True)
    contact_name = serializers.SerializerMethodField()
    company_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    tags_detail = TagSerializer(source='tags', many=True, read_only=True)
    stage_history = DealStageHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Deal
        fields = [
            'id', 'uuid', 'title', 'amount', 'currency',
            'pipeline', 'pipeline_name', 'stage', 'stage_name', 'stage_color', 'stage_probability',
            'contact', 'contact_name', 'company', 'company_name',
            'assigned_to', 'assigned_to_name', 'expected_close_date', 'actual_close_date',
            'deal_type', 'status', 'lost_reason', 'tags', 'tags_detail',
            'description', 'stage_history', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uuid', 'created_at', 'updated_at']

    def get_contact_name(self, obj):
        if obj.contact:
            return obj.contact.full_name
        return None

    def get_company_name(self, obj):
        if obj.company:
            return obj.company.name
        return None

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None
