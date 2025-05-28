"""Food serializers"""
from core.models.entities.food import FoodPlan

from .base import EntityBaseSerializer


class FoodPlanSerializer(EntityBaseSerializer):
    """FoodPlanSerializer"""

    class Meta:
        model = FoodPlan
        fields = "__all__"
        read_only_fields = ("category",)
