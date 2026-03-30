from rest_framework import serializers
from .models import Tag, CustomField


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color', 'created_at']


class CustomFieldSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomField
        fields = ['id', 'module', 'label', 'field_type', 'options', 'is_required', 'order', 'created_at']
