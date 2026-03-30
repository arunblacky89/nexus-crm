from rest_framework import serializers
from .models import Contact
from apps.settings_app.serializers import TagSerializer
from apps.companies.serializers import CompanyMiniSerializer


class ContactSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    assigned_to_name = serializers.SerializerMethodField()
    company_detail = CompanyMiniSerializer(source='company', read_only=True)
    tags_detail = TagSerializer(source='tags', many=True, read_only=True)
    deal_count = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = [
            'id', 'uuid', 'first_name', 'last_name', 'full_name', 'email',
            'phone', 'mobile', 'whatsapp', 'job_title', 'department',
            'company', 'company_detail', 'lead', 'assigned_to', 'assigned_to_name',
            'tags', 'tags_detail', 'linkedin_url', 'twitter_url', 'date_of_birth',
            'street', 'city', 'state', 'zip_code', 'country', 'avatar',
            'do_not_contact', 'deal_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uuid', 'lead', 'created_at', 'updated_at']

    def get_full_name(self, obj):
        return obj.full_name

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

    def get_deal_count(self, obj):
        return obj.deals.filter(is_deleted=False).count() if hasattr(obj, 'deals') else 0


class ContactMiniSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = ['id', 'uuid', 'full_name', 'email', 'phone', 'job_title']

    def get_full_name(self, obj):
        return obj.full_name
