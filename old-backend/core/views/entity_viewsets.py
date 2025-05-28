"""Entity viewsets"""

import logging
from typing import cast

from django.conf import settings
from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.filters import OrderingFilter
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet
from twilio.rest import Client

from core.models.entities.base import Entity
from core.models.entities.education import SchoolBreak, SchoolTerm, SchoolYear
from core.models.entities.social import GuestListInvite
from core.models.users.user_models import User
from core.serializers.entities.education import (
    SchoolBreakSerializer,
    SchoolTermSerializer,
    SchoolYearSerializer,
)
from core.serializers.entities.generic import EntitySerializer
from core.serializers.entities.guestlists import (
    GuestListInviteInviteeSerializer,
    GuestListInviteSerializer,
)
from notifications.utils.send_notification import send_push_message_if_valid
from utils.email_client import EmailClient

logger = logging.getLogger(__name__)


class EntityReadonlyViewSet(ReadOnlyModelViewSet):
    """EntityReadonlyViewSet

    A user should be able to see (but not necessarily edit) an entity under
    any of the following conditions:
        - The user is a member (or owner) of the entity
        - The user is a member (or owner) of a parent entity of the entity
        - The user is a member of a task that is tagged with the entity
        - The user is a member of a child entity of the entity
    """

    serializer_class = EntitySerializer
    permission_classes = [
        IsAuthenticated,
    ]
    filter_backends = [
        OrderingFilter,
    ]
    ordering = ["pk"]

    def get_queryset(self):
        return (
            Entity.objects.all()
            .filter(
                Q(owner=self.request.user)
                | (Q(members=self.request.user))
                | (Q(parent__owner=self.request.user))
                | (Q(parent__members=self.request.user))
                | (Q(tasks__members__pk=self.request.user.id))
                | (Q(child_entities__members__pk=self.request.user.id))
            )
            .distinct()
        )


class EntityViewSet(ModelViewSet):
    """EntityViewSet"""

    serializer_class = EntitySerializer
    permission_classes = [
        IsAuthenticated,
    ]
    filter_backends = [
        OrderingFilter,
    ]
    ordering = ["pk"]

    def get_queryset(self):
        return (
            Entity.objects.all()
            .filter(Q(owner=self.request.user) | (Q(members=self.request.user)))
            .distinct()
        )

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    def get_serializer(self, *args, **kwargs):
        if isinstance(kwargs.get("data", {}), list):
            kwargs["many"] = True

        return super().get_serializer(*args, **kwargs)

    def delete(self, request, pk=None):
        """Delete an entity"""
        pk_ids = request.data.get("pk_ids", None)
        if pk_ids:
            for i in pk_ids:
                get_object_or_404(Entity, pk=int(i)).delete()
        else:
            get_object_or_404(Entity, pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SchoolYearViewSet(ModelViewSet):
    """SchoolYearViewSet"""

    serializer_class = SchoolYearSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            SchoolYear.objects.all()
            .filter(Q(school__members=self.request.user))
            .distinct()
        )


class SchoolBreakViewSet(ModelViewSet):
    """SchoolBreakViewSet"""

    serializer_class = SchoolBreakSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            SchoolBreak.objects.all()
            .filter(Q(school_year__school__members=self.request.user))
            .distinct()
        )


class SchoolTermViewSet(ModelViewSet):
    """SchoolTermViewSet"""

    serializer_class = SchoolTermSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            SchoolTerm.objects.all()
            .filter(Q(school_year__school__members=self.request.user))
            .distinct()
        )


def send_invite(invite: GuestListInvite):
    """Sends the invite in the most appropriate way"""
    if invite.email:
        email_client = EmailClient()
        email_client.send_email(
            "You have been invited to an event",
            "event-invite-new.html",
            invite.email,
            plaintext_template="event-invite-new.txt",
        )

        invite.sent = True
        invite.save()

    elif invite.phone_number:
        sms_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        sms_client.messages.create(
            to=str(invite.phone_number),
            from_=settings.TWILIO_FROM_NUMBER,
            body="You have been invited to an event on Vuet!\n\nDownload the app from the app store now and sign up with this phone number to join in",
        )

        invite.sent = True
        invite.save()

    elif invite.user:
        tokens = invite.user.push_tokens.all()
        for token in tokens:
            message = "You have been invited to an event!"
            send_push_message_if_valid(token, message)

        invite.sent = True
        invite.save()


class GuestListInviteViewSet(ModelViewSet):
    """GuestListInviteViewSet"""

    serializer_class = GuestListInviteSerializer
    permission_classes = [
        IsAuthenticated,
    ]
    http_method_names = ["get", "post", "delete"]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return GuestListInvite.objects.all().filter(entity__members=user).distinct()

    @action(
        detail=True,
        methods=["get"],
    )
    def send(self, request, pk):
        """Action to send the invite"""
        invite = cast(GuestListInvite, self.get_object())

        if invite.sent:
            return Response(
                {"error": "Invite already sent"}, status=status.HTTP_400_BAD_REQUEST
            )

        send_invite(invite)

        return Response({"success": True}, status=status.HTTP_200_OK)

    @action(detail=True, methods=["get"], lookup_field="entity")
    def send_for_entity(self, request, pk):
        """Action to send all unsent invites for an entity"""
        invites = list(GuestListInvite.objects.filter(entity=pk, sent=False).all())

        for invite in invites:
            send_invite(invite)

        return Response({"success": True}, status=status.HTTP_200_OK)


class GuestListInviteInviteeViewSet(ModelViewSet):
    """GuestListInviteInviteeViewSet"""

    serializer_class = GuestListInviteInviteeSerializer
    permission_classes = [
        IsAuthenticated,
    ]
    http_method_names = ["patch", "get"]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return GuestListInvite.objects.all().filter(user=user, sent=True)
