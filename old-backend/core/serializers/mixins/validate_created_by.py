import logging
from typing import cast

from django.forms import ValidationError
from rest_framework import serializers
from rest_framework.request import Request

from core.models.users.user_models import User

logger = logging.getLogger(__name__)


class ValidatedCreatedByMixin(serializers.Serializer):
    """Mixin to validate created_by"""

    def validate_created_by(self, value):
        """validate_created_by"""
        request = cast(Request, self.context.get("request"))
        user = cast(User, request.user)

        if not value == user:
            raise ValidationError(
                {
                    "message": "Invalid created_by",
                    "code": "invalid_created_by",
                }
            )

        return user
