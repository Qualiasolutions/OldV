"""Notification serializers"""

from django.contrib.auth import get_user_model
from rest_framework.serializers import (
    CurrentUserDefault,
    ModelSerializer,
    PrimaryKeyRelatedField,
)

from .models import PushToken


class PushTokenSerializer(ModelSerializer):
    """PushTokenSerializer"""

    user = PrimaryKeyRelatedField(
        default=CurrentUserDefault(),
        queryset=get_user_model().objects.all(),
    )

    class Meta:
        model = PushToken
        fields = "__all__"
