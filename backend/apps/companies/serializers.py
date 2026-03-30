from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.SerializerMethodField()
    contact_count = serializers.SerializerMethodField()
    deal_count = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            'id', 'uuid', 'name', 'website', 'phone', 'email', 'industry',
            'company_size', 'annual_revenue', 'parent_company', 'assigned_to',
            'assigned_to_name', 'street', 'city', 'state', 'zip_code', 'country',
            'logo', 'linkedin_url', 'twitter_url', 'description',
            'contact_count', 'deal_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'uuid', 'created_at', 'updated_at']

    def get_assigned_to_name(self, obj):
        if obj.assigned_to:
            return obj.assigned_to.get_full_name() or obj.assigned_to.username
        return None

    def get_contact_count(self, obj):
        return obj.contacts.filter(is_deleted=False).count() if hasattr(obj, 'contacts') else 0

    def get_deal_count(self, obj):
        return obj.deals.filter(is_deleted=False).count() if hasattr(obj, 'deals') else 0


class CompanyMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'uuid', 'name', 'industry', 'city', 'country']
