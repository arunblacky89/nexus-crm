from rest_framework import serializers
from .models import EmailTemplate, EmailLog


class EmailTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplate
        fields = ['id', 'name', 'subject', 'body', 'category', 'created_by', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class EmailLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailLog
        fields = [
            'id', 'to_email', 'from_email', 'subject', 'body', 'status',
            'related_lead', 'related_contact', 'related_deal',
            'sent_at', 'opened_at', 'sent_by',
        ]
        read_only_fields = ['id', 'sent_at', 'sent_by', 'from_email']


class SendEmailSerializer(serializers.Serializer):
    to_email = serializers.EmailField()
    subject = serializers.CharField()
    body = serializers.CharField()
    template_id = serializers.IntegerField(required=False, allow_null=True)
    related_lead = serializers.IntegerField(required=False, allow_null=True)
    related_contact = serializers.IntegerField(required=False, allow_null=True)
    related_deal = serializers.IntegerField(required=False, allow_null=True)
