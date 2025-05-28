"""Laundry serializers"""
from core.models.entities.laundry import LaundryPlan

from .base import EntityBaseSerializer


class LaundryPlanSerializer(EntityBaseSerializer):
    """LaundryPlanSerializer"""

    class Meta:
        model = LaundryPlan
        fields = "__all__"
        read_only_fields = ("category",)
