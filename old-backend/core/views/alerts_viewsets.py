"""Alerts viewset"""

from typing import cast

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.mixins import DestroyModelMixin, ListModelMixin, RetrieveModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet

from core.models.tasks.alerts import ActionAlert, Alert
from core.models.users.user_models import User
from core.serializers.alerts import ActionAlertSerializer, AlertSerializer


class AlertsViewSet(
    ListModelMixin, RetrieveModelMixin, DestroyModelMixin, GenericViewSet
):
    """AlertsViewSet"""

    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return (
            Alert.objects.all().filter(user=user)
            # .filter(
            #     Q(user__family=user.family)
            #     & (Q(task__entities__members=user) | Q(task__members=user))
            # )
            .distinct()
        )


class ActionAlertsViewSet(
    ListModelMixin, RetrieveModelMixin, DestroyModelMixin, GenericViewSet
):
    """ActionAlertsViewSet"""

    serializer_class = ActionAlertSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return (
            ActionAlert.objects.all().filter(user=user)
            # .filter(
            #     Q(user__family=user.family)
            #     & (
            #         (
            #             Q(action__task__entities__members=user)
            #             | Q(action__task__members=user)
            #         )
            #     )
            # )
            .distinct()
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def mark_alerts_read(request):
    """Mark all alerts as read for a specified user"""
    user_id = request.data.get("user")
    if not request.user.id == user_id:
        return Response(
            {"success": False, "detail": "Invalid user"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    Alert.objects.filter(user=request.user).update(read=True)
    ActionAlert.objects.filter(user=request.user).update(read=True)

    return Response(
        {"success": True},
        status=status.HTTP_200_OK,
    )
