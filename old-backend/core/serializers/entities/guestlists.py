"""GUestlist-related serializers"""
from rest_framework.serializers import ModelSerializer, ValidationError

from core.models.entities.base import Entity
from core.models.entities.social import GuestListInvite
from core.models.users.user_models import User
from core.serializers.entities.generic import EntitySerializer


class GuestListInviteSerializer(ModelSerializer):
    """GuestListInviteSerializer"""

    class Meta:
        model = GuestListInvite
        fields = "__all__"
        read_only_fields = ("accepted", "rejected", "maybe", "sent")

    @property
    def _user(self):
        req = self.context.get("request")
        if req:
            return req.user

    def validate_email(self, val: str):
        """Make email lowercase"""
        if not val:
            return val

        lowercase = val.lower()
        return super().validate(lowercase)

    def validate_entity(self, val: Entity):
        """Ensure that requesting user has permissions on the entity"""
        if not self._user in val.members.all():
            raise ValidationError(
                f"User does not have permissions to invite members to entity {val.pk}"
            )

        return val

    def validate(self, attrs, *args, **kwargs):
        """Validate the data
        Ensure that the `user` attribute is set when the phone number
        or email address matches an existing user
        """
        provided_values = [
            attrs.get("user"),
            attrs.get("phone_number"),
            attrs.get("email"),
        ]

        if len([val for val in provided_values if val]) > 1:
            error_message = "Only one of user, email and phone_number may be provided"
            raise ValidationError(
                {
                    "user": error_message,
                    "phone_number": error_message,
                    "email": error_message,
                }
            )

        if attrs.get("phone_number"):
            if User.objects.filter(phone_number=attrs.get("phone_number")).exists():
                phone_number = attrs.pop("phone_number")
                attrs["user"] = User.objects.get(phone_number=phone_number)
        elif attrs.get("email"):
            if User.objects.filter(email=attrs.get("email")).exists():
                email = attrs.pop("email")
                attrs["user"] = User.objects.get(email=email)

        return super().validate(attrs, *args, **kwargs)


class GuestListInviteInviteeSerializer(ModelSerializer):
    """GuestListInviteInviteeSerializer"""

    entity = EntitySerializer(read_only=True)

    class Meta:
        model = GuestListInvite
        fields = (
            "id",
            "entity",
            "accepted",
            "rejected",
            "maybe",
        )
        read_only_fields = (
            "id",
            "entity",
        )

    @property
    def _user(self):
        req = self.context.get("request")
        if req:
            return req.user

    def validate(self, attrs, *args, **kwargs):
        """Validate the data
        Ensure that the `user` attribute is set when the phone number
        or email address matches an existing user
        """
        provided_values = [
            attrs.get("accepted"),
            attrs.get("rejected"),
            attrs.get("maybe"),
        ]

        if len([val for val in provided_values if val is not None]) > 1:
            error_message = "Only one of accepted, rejected and maybe may be chosen"
            raise ValidationError(
                {
                    "accepted": error_message,
                    "rejected": error_message,
                    "maybe": error_message,
                }
            )

        if attrs.get("accepted"):
            attrs["rejected"] = False
            attrs["maybe"] = False
        if attrs.get("rejected"):
            attrs["accepted"] = False
            attrs["maybe"] = False
        if attrs.get("maybe"):
            attrs["accepted"] = False
            attrs["rejected"] = False

        return super().validate(attrs, *args, **kwargs)
