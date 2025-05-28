"""Notification views"""

from typing import cast

from rest_framework.mixins import CreateModelMixin, ListModelMixin, UpdateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet

from core.models.users.user_models import User

from .models import PushToken
from .serializers import PushTokenSerializer


class PushTokenViewSet(
    CreateModelMixin, ListModelMixin, UpdateModelMixin, GenericViewSet
):
    """PushTokenViewSet"""

    serializer_class = PushTokenSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return PushToken.objects.filter(user=user)
