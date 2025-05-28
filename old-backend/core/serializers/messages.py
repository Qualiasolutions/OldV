"""Serializers for messages"""
from rest_framework.serializers import (
    ModelSerializer,
    SerializerMethodField,
    ValidationError,
)

from core.models.messages.base import Message
from core.serializers.mixins.validate_user import ValidateUserMixin


class MessageSerializer(ValidateUserMixin, ModelSerializer):
    """MessageSerializer"""

    name = SerializerMethodField(read_only=True)

    class Meta:
        model = Message
        fields = "__all__"

    @property
    def _user(self):
        """The user that made the request"""
        context = getattr(self, "context")
        request = context.get("request", None)
        if request:
            return request.user

    def validate_task(self, value):
        """Ensure that the user has permissions on the task"""
        if not value or self._user in value.members.all():
            return value

        raise ValidationError("Invalid Task")

    def validate_entity(self, value):
        """Ensure that the user has permissions on the entity"""
        if not value or self._user in value.members.all():
            return value

        raise ValidationError("Invalid Entity")

    def get_name(self, instance):
        """Get the name of the sender"""
        user = instance.user
        return f"{user.first_name} {user.last_name}"
