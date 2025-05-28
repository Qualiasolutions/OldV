"""Serializers for alerts"""

from rest_framework.serializers import ModelSerializer

from core.models.tasks.alerts import ActionAlert, Alert
from core.serializers.mixins.validate_user import ValidateUserMixin


class AlertSerializer(ValidateUserMixin, ModelSerializer):
    """AlertSerializer"""

    class Meta:
        model = Alert
        fields = "__all__"


class ActionAlertSerializer(ValidateUserMixin, ModelSerializer):
    """ActionAlertSerializer"""

    class Meta:
        model = ActionAlert
        fields = "__all__"
