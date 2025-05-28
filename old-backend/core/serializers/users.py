"""user serializers"""

import logging
from datetime import datetime, timedelta
from typing import cast

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.db.models import Q
from rest_framework.fields import SerializerMethodField
from rest_framework.serializers import CharField, ModelSerializer, ValidationError

from core.models.tasks.base import TaskMembership
from core.models.tasks.holidays import HolidayTask
from core.models.users.user_models import (
    CategorySetupCompletion,
    EntityTypeSetupCompletion,
    Family,
    Friendship,
    LastActivityView,
    LinkListSetupCompletion,
    ReferencesSetupCompletion,
    TagSetupCompletion,
    User,
    UserInvite,
)
from core.serializers.mixins.validate_user import ValidateUserMixin
from subscriptions.models import Subscription
from vuet_auth.models.forgot_password_validations import ForgotPasswordValidation
from vuet_auth.models.phone_validations import PhoneValidation

logger = logging.getLogger(__name__)


class UserSecureUpdateSerializer(ModelSerializer):
    """UserSecureUpdateSerializer"""

    old_password = CharField(
        write_only=True,
        required=False,
    )

    reset_password_code = CharField(
        write_only=True,
        required=False,
    )

    class Meta:
        model = get_user_model()
        fields = ("password", "old_password", "reset_password_code")

    def validate_old_password(self, value):
        """Ensure that old_password matches the current user password"""
        user = cast(User, self.instance)
        if not user.check_password(value):
            raise ValidationError(
                {
                    "message": "The provided password does not match the current user password",
                    "code": "invalid_old_password",
                }
            )
        return value

    def validate_reset_password_code(self, value):
        """Ensure that reset_password_code matches the validation code"""
        user = cast(User, self.instance)
        validation = ForgotPasswordValidation.objects.filter(
            user=user,
            created_at__gte=datetime.now() - timedelta(minutes=15),
        ).first()
        if not (validation and validation.code == value):
            raise ValidationError(
                {
                    "message": "The provided code does not match the validation code",
                    "code": "invalid_reset_password_code",
                }
            )
        return value

    def validate_password(self, value):
        """validate_password"""
        if not value:
            raise ValidationError(
                {
                    "message": "Invalid password",
                    "code": "invalid_password",
                }
            )

        return make_password(value)

    def validate(self, attrs, *args, **kwargs):
        validated = super().validate(attrs, *args, **kwargs)
        old_password = validated.get("old_password")
        reset_password_code = validated.get("reset_password_code")
        if not (old_password or reset_password_code):
            raise ValidationError(
                {
                    "old_password": {
                        "message": "Old password or reset code required",
                        "code": "no_old_password",
                    },
                    "reset_password_code": {
                        "message": "Old password or reset code required",
                        "code": "no_code",
                    },
                }
            )
        return validated


class UserMinimalSerializer(ModelSerializer):
    """UserMinimalSerializer
    This is used to give the minimal possible amount of information
    on a user who may not be friend or family of a requesting user
    """

    class Meta:
        model = get_user_model()
        fields = ["phone_number", "email", "member_colour", "id"]


class UserSerializer(ModelSerializer):
    """UserSerializer"""

    presigned_profile_image_url = CharField(read_only=True)

    class Meta:
        model = get_user_model()
        exclude = ["password", "user_permissions", "groups"]
        # profile_image excluded from reads because it changes on every request which
        # can cause a weird bug where RTK Query gets stuck in a loop
        extra_kwargs = {"profile_image": {"write_only": True}}

    def validate_family(self, value):
        """Ensure that the user has been invited to this family"""
        if value:
            instance = cast(User | None, self.instance)
            if instance:
                user_invites = UserInvite.objects.filter(
                    phone_number=instance.phone_number
                )
                user_invite_families = user_invites.select_related("family").all()
                if len(user_invite_families) == 0:
                    raise ValidationError(
                        {
                            "message": "The user has not been invited to that family",
                            "code": "user_not_invited",
                        }
                    )
                return value

    def validate_phone_number(self, value):
        """Ensure that the new phone number has been validated"""
        validations = PhoneValidation.objects.filter(
            phone_number=value,
            validated=True,
            created_at__gte=datetime.now() - timedelta(days=1),
        )
        if not validations.exists():
            raise ValidationError(
                {
                    "message": "This phone number has not been validated",
                    "code": "unvalidated_number",
                }
            )
        return value

    def update(self, instance, validated_data):
        """Update"""
        new_family = validated_data.get("family")

        if new_family:
            family_members_set = set(new_family.users.all())

            family_holiday_tasks = list(
                HolidayTask.objects.filter(
                    members__in=new_family.users.all()
                ).distinct()
            )
            full_family_holiday_tasks = [
                task
                for task in family_holiday_tasks
                if family_members_set.issubset(set(task.members.all()))
            ]

            TaskMembership.objects.bulk_create(
                [
                    TaskMembership(task=task, member=instance)
                    for task in full_family_holiday_tasks
                ]
            )

        return super().update(instance, validated_data)


class FamilySerializer(ModelSerializer):
    """FamilySerializer"""

    users = UserSerializer(many=True)
    presigned_image_url = CharField(read_only=True)

    class Meta:
        model = Family
        fields = "__all__"
        # image excluded from reads because it changes on every request which
        # can cause a weird bug where RTK Query gets stuck in a loop
        extra_kwargs = {"image": {"write_only": True}}


class UserWithFamilySerializer(ModelSerializer):
    """UserWithFamilySerializer"""

    family = FamilySerializer()
    friends = UserSerializer(many=True)
    presigned_profile_image_url = CharField(read_only=True)
    is_premium = SerializerMethodField()

    class Meta:
        model = get_user_model()
        exclude = ["password", "user_permissions", "groups"]
        read_only_fields = ["family"]
        # profile_image excluded from reads because it changes on every request which
        # can cause a weird bug where RTK Query gets stuck in a loop
        extra_kwargs = {"profile_image": {"write_only": True}}

    def get_is_premium(self, instance):
        """get_is_premium"""
        return Subscription.objects.filter(
            Q(user=instance)
            | (Q(user__in=instance.family.users.all()) & Q(is_family=True))
        ).exists()


class UserInviteSerializer(ModelSerializer):
    """UserInviteSerializer"""

    class Meta:
        model = UserInvite
        fields = "__all__"
        read_only_fields = ("accepted",)

    @property
    def _user(self):
        req = self.context.get("request")
        if req:
            return req.user

    def validate_phone_number(self, value):
        """validate_phone_number"""
        if value == self._user.phone_number:
            raise ValidationError(
                {
                    "message": "You cannot add yourself as a friend",
                    "code": "self_befriending",
                }
            )

        return value

    def validate_email(self, value):
        """validate_email"""
        if value == self._user.email:
            raise ValidationError(
                {
                    "message": "You cannot add yourself as a friend",
                    "code": "self_befriending",
                }
            )

        return value

    def validate_family(self, value):
        """validate_family"""
        request = self.context.get("request")
        if not value:
            return value
        if request and hasattr(request, "user"):
            user = request.user
            if user.is_superuser:
                return value

            family = user.family
            if family:
                return family
            else:
                raise ValidationError(
                    {"message": "User has no family", "code": "user_has_no_family"}
                )
        else:
            raise ValidationError({"message": "No user provided", "code": "no_user"})

    def validate(self, attrs):
        validated = super().validate(attrs)
        phone_number = attrs.get("phone_number")
        email = attrs.get("email")
        family = attrs.get("family")

        if self.instance and not phone_number and not email:
            # No further validation is required if we are updating an
            # invite and not changing the phone number or email
            return validated

        if not family:
            # In this case it is a friend request and we
            # aren't worried about further validation
            return validated

        if phone_number:
            existing_invites = UserInvite.objects.filter(
                phone_number=phone_number, rejected=False
            )
            existing_users = User.objects.filter(phone_number=phone_number)
        elif email:
            existing_invites = UserInvite.objects.filter(email=email, rejected=False)
            existing_users = User.objects.filter(email=email)
        else:
            raise ValidationError(
                {
                    "phone_number": {
                        "message": "Either phone number or email must be provided",
                        "code": "no_contact_details",
                    },
                    "email": {
                        "message": "Either phone number or email must be provided",
                        "code": "no_contact_details",
                    },
                },
            )

        if existing_users.exists():
            existing_user = existing_users.get()
            existing_family = existing_user.family
            if existing_family == family:
                raise ValidationError(
                    {
                        "phone_number"
                        if phone_number
                        else "email": {
                            "message": "This user has already been added to the family",
                            "code": "already_in_family",
                        }
                    }
                )
            elif existing_family and (existing_family.users.count() > 1):
                raise ValidationError(
                    {
                        "phone_number"
                        if phone_number
                        else "email": {
                            "message": "This user is already a member of a family",
                            "code": "already_has_family",
                        }
                    }
                )

        if existing_invites.exists():
            invited_families = [invite.family for invite in list(existing_invites)]
            if family in invited_families:
                raise ValidationError(
                    {
                        "phone_number"
                        if phone_number
                        else "email": {
                            "message": "User has already been invited",
                            "code": "already_invited",
                        }
                    }
                )

        return validated


class CategorySetupCompletionSerializer(ValidateUserMixin, ModelSerializer):
    """CategorySetupCompletionSerializer"""

    class Meta:
        model = CategorySetupCompletion
        fields = "__all__"


class ReferencesSetupCompletionSerializer(ValidateUserMixin, ModelSerializer):
    """ReferencesSetupCompletionSerializer"""

    class Meta:
        model = ReferencesSetupCompletion
        fields = "__all__"


class EntityTypeSetupCompletionSerializer(ValidateUserMixin, ModelSerializer):
    """EntityTypeSetupCompletionSerializer"""

    class Meta:
        model = EntityTypeSetupCompletion
        fields = "__all__"


class TagSetupCompletionSerializer(ValidateUserMixin, ModelSerializer):
    """TagSetupCompletionSerializer"""

    class Meta:
        model = TagSetupCompletion
        fields = "__all__"


class LinkListSetupCompletionSerializer(ValidateUserMixin, ModelSerializer):
    """LinkListSetupCompletionSerializer"""

    class Meta:
        model = LinkListSetupCompletion
        fields = "__all__"


class UserInviteInviteeSerializer(ModelSerializer):
    """UserInviteInviteeSerializer"""

    class Meta:
        model = get_user_model()
        fields = ["id", "first_name", "last_name"]


class FullUserInviteSerializer(ModelSerializer):
    """FullUserInviteSerializer"""

    invitee = UserInviteInviteeSerializer()

    class Meta:
        model = UserInvite
        fields = "__all__"
        read_only_fields = ("accepted",)


class FriendshipSerializer(ModelSerializer):
    """FriendshipSerializer"""

    class Meta:
        model = Friendship
        fields = "__all__"

    @property
    def _user(self):
        req = self.context.get("request")
        if req:
            return req.user

    def validate_friend(self, value):
        """validate_friend"""
        if value and (value != self._user):
            raise ValidationError(
                {
                    "message": "Cannot create friendship for other users",
                    "code": "user_not_friend",
                }
            )

        return self._user

    def validate_creator(self, value):
        """validate_creator"""
        if self._user == value:
            raise ValidationError(
                {
                    "message": "You cannot add yourself as a friend",
                    "code": "self_befriending",
                }
            )
        try:
            UserInvite.objects.get(phone_number=self._user.phone_number, invitee=value)
            return value
        except Exception as exc:
            raise ValidationError(
                {
                    "message": "The user has not been invited to become friends",
                    "code": "user_not_invited",
                }
            ) from exc


class LastActivityViewSerializer(ValidateUserMixin, ModelSerializer):
    """LastActivityViewSerializer"""

    class Meta:
        model = LastActivityView
        fields = "__all__"
