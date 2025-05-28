"""Travel entity serializers"""

from timezone_field.rest_framework import TimeZoneSerializerField  # type: ignore

from core.models.entities.travel import TravelPlan, Trip

from .base import EntityBaseSerializer


class TripSerializer(EntityBaseSerializer):
    """TripSerializer"""

    class Meta:
        model = Trip
        fields = "__all__"
        read_only_fields = ("category",)


class TravelPlanSerializer(EntityBaseSerializer):
    """TravelPlanSerializer"""

    class Meta:
        model = TravelPlan
        fields = "__all__"
        read_only_fields = ("category",)


class ModeOfTravelSerializer(EntityBaseSerializer):
    """ModeOfTravelSerializer"""

    start_timezone = TimeZoneSerializerField(use_pytz=False)
    end_timezone = TimeZoneSerializerField(use_pytz=False)
