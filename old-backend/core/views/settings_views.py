import logging
from typing import cast

from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

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
from core.models.users.user_models import User
from core.serializers.settings import (
    BirthdayBlockedCategorySerializer,
    DaysOffBlockedCategorySerializer,
    FamilyBirthdayBlockedCategorySerializer,
    FamilyCategoryViewPermissionSerializer,
    NationalHolidaysBlockedCategorySerializer,
    PreferredDaysSerializer,
    TermTimeBlockedCategorySerializer,
    TripBlockedCategorySerializer,
)

logger = logging.getLogger(__name__)


class FamilyCategoryViewPermissionViewset(ModelViewSet):
    """FamilyCategoryViewPermissionViewset"""

    serializer_class = FamilyCategoryViewPermissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return FamilyCategoryViewPermission.objects.filter(user=user).distinct()


class PreferredDaysViewset(ModelViewSet):
    """PreferredDaysViewset"""

    serializer_class = PreferredDaysSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return PreferredDays.objects.filter(user=user).distinct()


class BirthdayBlockedCategoryViewset(ModelViewSet):
    """BirthdayBlockedCategoryViewset"""

    serializer_class = BirthdayBlockedCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return BirthdayBlockedCategory.objects.filter(user=user).distinct()


class FamilyBirthdayBlockedCategoryViewset(ModelViewSet):
    """FamilyBirthdayBlockedCategoryViewset"""

    serializer_class = FamilyBirthdayBlockedCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return FamilyBirthdayBlockedCategory.objects.filter(user=user).distinct()


class NationalHolidaysBlockedCategoryViewset(ModelViewSet):
    """NationalHolidaysBlockedCategoryViewset"""

    serializer_class = NationalHolidaysBlockedCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return NationalHolidaysBlockedCategory.objects.filter(user=user).distinct()


class TermTimeBlockedCategoryViewset(ModelViewSet):
    """TermTimeBlockedCategoryViewset"""

    serializer_class = TermTimeBlockedCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return TermTimeBlockedCategory.objects.filter(user=user).distinct()


class TripBlockedCategoryViewset(ModelViewSet):
    """TripBlockedCategoryViewset"""

    serializer_class = TripBlockedCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return TripBlockedCategory.objects.filter(user=user).distinct()


class DaysOffBlockedCategoryViewset(ModelViewSet):
    """DaysOffBlockedCategoryViewset"""

    serializer_class = DaysOffBlockedCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return DaysOffBlockedCategory.objects.filter(user=user).distinct()
