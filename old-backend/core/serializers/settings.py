"""Settings serializers"""
from rest_framework.serializers import ModelSerializer

from core.models.settings.blocked_days import (
    BirthdayBlockedCategory,
    DaysOffBlockedCategory,
    FamilyBirthdayBlockedCategory,
    NationalHolidaysBlockedCategory,
    TermTimeBlockedCategory,
    TripBlockedCategory,
)
from core.models.settings.family_visibility import FamilyCategoryViewPermission
from core.models.settings.preferred_days import PreferredDays
from core.serializers.mixins.validate_user import ValidateUserMixin


class FamilyCategoryViewPermissionSerializer(ValidateUserMixin, ModelSerializer):
    """FamilyCategoryViewPermissionSerializer"""

    class Meta:
        model = FamilyCategoryViewPermission
        fields = "__all__"


class PreferredDaysSerializer(ValidateUserMixin, ModelSerializer):
    """PreferredDaysSerializer"""

    class Meta:
        model = PreferredDays
        fields = "__all__"


class BirthdayBlockedCategorySerializer(ValidateUserMixin, ModelSerializer):
    """BirthdayBlockedCategorySerializer"""

    class Meta:
        model = BirthdayBlockedCategory
        fields = "__all__"


class FamilyBirthdayBlockedCategorySerializer(ValidateUserMixin, ModelSerializer):
    """FamilyBirthdayBlockedCategorySerializer"""

    class Meta:
        model = FamilyBirthdayBlockedCategory
        fields = "__all__"


class NationalHolidaysBlockedCategorySerializer(ValidateUserMixin, ModelSerializer):
    """NationalHolidaysBlockedCategorySerializer"""

    class Meta:
        model = NationalHolidaysBlockedCategory
        fields = "__all__"


class DaysOffBlockedCategorySerializer(ValidateUserMixin, ModelSerializer):
    """DaysOffBlockedCategorySerializer"""

    class Meta:
        model = DaysOffBlockedCategory
        fields = "__all__"


class TripBlockedCategorySerializer(ValidateUserMixin, ModelSerializer):
    """TripBlockedCategorySerializer"""

    class Meta:
        model = TripBlockedCategory
        fields = "__all__"


class TermTimeBlockedCategorySerializer(ValidateUserMixin, ModelSerializer):
    """TermTimeBlockedCategorySerializer"""

    class Meta:
        model = TermTimeBlockedCategory
        fields = "__all__"
