from rest_framework import serializers
from .models import Activity


class ActivitySerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    related_lead_name = serializers.SerializerMethodField()
    related_contact_name = serializers.SerializerMethodField()
    related_deal_name = serializers.SerializerMethodField()
    related_company_name = serializers.SerializerMethodField()

    class Meta:
        model = Activity
        fields = [
            'id', 'uuid', 'activity_type', 'title', 'description', 'due_date',
            'completed', 'completed_at', 'priority',
            'assigned_to', 'assigned_to_name',
            'related_lead', 'related_lead_name',
            'related_contact', 'related_contact_name',
            'related_deal', 'related_deal_name',
            'related_company', 'related_company_name',
            'call_direction', 'call_duration_minutes', 'call_result', 'call_recording_url',
            'location', 'meeting_link', 'meeting_type', 'attendees',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uuid', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

    def get_related_lead_name(self, obj):
        return obj.related_lead.full_name if obj.related_lead else None

    def get_related_contact_name(self, obj):
        return obj.related_contact.full_name if obj.related_contact else None

    def get_related_deal_name(self, obj):
        return obj.related_deal.title if obj.related_deal else None

    def get_related_company_name(self, obj):
        return obj.related_company.name if obj.related_company else None
