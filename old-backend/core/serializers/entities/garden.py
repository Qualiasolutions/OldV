"""Garden serializers"""
from core.models.entities.garden import Garden

from .base import EntityBaseSerializer


class GardenSerializer(EntityBaseSerializer):
    """GardenSerializer"""

    class Meta:
        model = Garden
        fields = "__all__"
        read_only_fields = ("category",)
