"""Category Serializers"""
from rest_framework import serializers

from core.models.categories.categories import ProfessionalCategory
from core.serializers.mixins.validate_user import ValidateUserMixin


class CategoryConfigSerializer(serializers.Serializer):
    """CategoryConfigSerializer"""

    id = serializers.IntegerField()
    name = serializers.CharField()
    readable_name = serializers.CharField()
    is_enabled = serializers.BooleanField()
    is_premium = serializers.BooleanField()


class ProfessionalCategorySerializer(ValidateUserMixin, serializers.ModelSerializer):
    """ProfessionalCategorySerializer"""

    class Meta:
        model = ProfessionalCategory
        fields = "__all__"
