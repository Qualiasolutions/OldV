"""Home serializers"""
from core.models.entities.home import Home

from .base import EntityBaseSerializer


class HomeSerializer(EntityBaseSerializer):
    """HomeSerializer"""

    class Meta:
        model = Home
        fields = "__all__"
        read_only_fields = ("category",)
