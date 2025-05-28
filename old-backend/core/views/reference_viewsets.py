import logging
from typing import cast

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from core.models.entities.base import Reference, ReferenceGroup
from core.models.users.user_models import User
from core.serializers.references import (
    ReferenceGroupSerializer,
    ReferenceSerializer,
    UnredactedReferenceSerializer,
)

logger = logging.getLogger(__name__)


class ReferenceViewset(ModelViewSet):
    """ReferenceViewset"""

    serializer_class = ReferenceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return Reference.objects.filter(
            Q(group__entities__members=user) | Q(group__created_by=user)
        ).distinct()


class ReferenceGroupViewset(ModelViewSet):
    """ReferenceGroupViewset"""

    serializer_class = ReferenceGroupSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return ReferenceGroup.objects.filter(
            Q(entities__members=user) | Q(created_by=user)
        ).distinct()


@api_view(["POST"])
def retrieve_password_reference(request):
    """Retrieve a password reference"""
    password = request.data.get("password")
    reference = request.data.get("reference")
    user = cast(User, request.user)

    if not user.check_password(password):
        return Response(
            {"success": False, "detail": "Invalid password"},
            status=status.HTTP_401_UNAUTHORIZED,
        )

    ref = Reference.objects.get(pk=reference)
    serializer = UnredactedReferenceSerializer(ref)
    return Response(serializer.data, status=status.HTTP_200_OK)
