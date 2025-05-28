"""Social entity serializers"""
from rest_framework.serializers import ModelSerializer, ValidationError

from core.models.entities.anniversaries import Anniversary, Birthday
from core.models.entities.base import Entity
from core.models.entities.social import (
    AnniversaryPlan,
    Event,
    EventSubentity,
    Hobby,
    Holiday,
    HolidayPlan,
    SocialMedia,
    SocialPlan,
)
from core.models.users.user_models import User

from .base import EntityBaseSerializer


class EventSerializer(EntityBaseSerializer):
    """EventSerializer"""

    class Meta:
        model = Event
        fields = "__all__"
        read_only_fields = ("category",)


class EventSubentitySerializer(EntityBaseSerializer):
    """EventSubentitySerializer"""

    class Meta:
        model = EventSubentity
        fields = "__all__"
        read_only_fields = ("category",)


class AnniversarySerializer(EntityBaseSerializer):
    """AnniversarySerializer"""

    class Meta:
        model = Anniversary
        fields = "__all__"
        read_only_fields = ("category",)


class BirthdaySerializer(EntityBaseSerializer):
    """BirthdaySerializer"""

    class Meta:
        model = Birthday
        fields = "__all__"
        read_only_fields = ("category",)


class HobbySerializer(EntityBaseSerializer):
    """HobbySerializer"""

    class Meta:
        model = Hobby
        fields = "__all__"
        read_only_fields = ("category",)


class SocialMediaSerializer(EntityBaseSerializer):
    """SocialMediaSerializer"""

    class Meta:
        model = SocialMedia
        fields = "__all__"
        read_only_fields = ("category",)


class SocialPlanSerializer(EntityBaseSerializer):
    """SocialPlanSerializer"""

    class Meta:
        model = SocialPlan
        fields = "__all__"
        read_only_fields = ("category",)


class HolidaySerializer(EntityBaseSerializer):
    """HolidaySerializer"""

    class Meta:
        model = Holiday
        fields = "__all__"


class HolidayPlanSerializer(EntityBaseSerializer):
    """HolidayPlanSerializer"""

    class Meta:
        model = HolidayPlan
        fields = "__all__"


class AnniversaryPlanSerializer(EntityBaseSerializer):
    """AnniversaryPlanSerializer"""

    class Meta:
        model = AnniversaryPlan
        fields = "__all__"
