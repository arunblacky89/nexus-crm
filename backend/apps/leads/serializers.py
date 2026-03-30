from rest_framework import serializers
from .models import Lead
from apps.settings_app.serializers import TagSerializer


class LeadSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    tags_detail = TagSerializer(source='tags', many=True, read_only=True)

    class Meta:
        model = Lead
        fields = [
            'id', 'uuid', 'first_name', 'last_name', 'full_name', 'email', 'phone', 'mobile',
            'company_name', 'job_title', 'website', 'lead_source', 'status', 'priority',
            'assigned_to', 'assigned_to_name', 'tags', 'tags_detail', 'lead_score',
            'city', 'state', 'country', 'description', 'notes',
            'converted', 'converted_at', 'created_by', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uuid', 'lead_score', 'converted', 'converted_at', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return obj.full_name

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None
