"""user validation mixin"""
from rest_framework.serializers import ValidationError


class ValidateUserMixin:
    """ValidateUserMixin"""

    @property
    def _user(self):
        """The user that made the request"""
        context = getattr(self, "context")
        request = context.get("request", None)
        if request:
            return request.user

    def validate_user(self, value):
        """Validate that the user is the requesting user"""
        if not value.id == self._user.id:
            raise ValidationError(
                {
                    "message": "Cannot set user to a different user",
                    "code": "invalid_user",
                }
            )
        return value
