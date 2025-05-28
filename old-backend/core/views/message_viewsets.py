"""Viewsets for messages"""

import logging
from typing import cast

from django.db.models import Q
from django_filters import rest_framework as filters  # type: ignore
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from core.models.messages.base import Message
from core.models.users.user_models import User
from core.serializers.messages import MessageSerializer

logger = logging.getLogger(__name__)


class MessageViewset(ModelViewSet):
    """Messages Viewset"""

    filter_backends = (filters.DjangoFilterBackend,)
    filterset_fields = ("task", "entity", "action", "recurrence_index")

    serializer_class = MessageSerializer

    def get_queryset(self):
        user = cast(User, self.request.user)
        return (
            Message.objects.filter(
                (Q(entity__isnull=False) & Q(entity__members=user))
                | (
                    Q(task__isnull=False)
                    & (Q(task__members=user) | Q(task__entities__members=user))
                )
                | (
                    Q(action__task__isnull=False)
                    & (
                        Q(action__task__members=user)
                        | Q(action__task__entities__members=user)
                    )
                )
            )
            .distinct()
            .order_by("id")
        )


@api_view(["GET"])
def message_threads(request):
    """Get all threads with messages"""
    user = cast(User, request.user)
    latest_messages = (
        Message.objects.filter(
            (Q(entity__isnull=False) & Q(entity__members=user))
            | (
                Q(task__isnull=False)
                & (Q(task__members=user) | Q(task__entities__members=user))
            )
            | (
                Q(action__isnull=False)
                & (
                    Q(action__task__members=user)
                    | Q(action__task__entities__members=user)
                )
            )
        )
        .order_by("entity", "task", "action", "recurrence_index", "-created_at")
        .distinct(
            "entity",
            "task",
            "action",
            "recurrence_index",
        )
    )

    serialized_data = sorted(
        MessageSerializer(latest_messages, many=True).data,
        key=lambda message: message["created_at"],
        reverse=True,
    )

    return Response(
        serialized_data,
        status=status.HTTP_200_OK,
    )
