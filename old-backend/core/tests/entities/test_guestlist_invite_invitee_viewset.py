"""Test guestlist invite invitee viewset"""

import datetime as dt
import logging

import pytz
from django.test import TestCase
from parameterized import parameterized  # type: ignore
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.social import Event, GuestListInvite
from core.models.users.user_models import Family, User
from core.utils.categories import Categories
from core.views.entity_viewsets import GuestListInviteInviteeViewSet

utc = pytz.UTC


logger = logging.getLogger(__name__)


class TestGuestlistInviteInviteeUpdate(TestCase):
    """TestGuestlistInviteInviteeUpdate"""

    def setUp(self):
        family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=family
        )
        self.event: Event = Event.objects.create(
            name="Test Event",
            category=Categories.SOCIAL_INTERESTS.value,
            start_datetime=dt.datetime(year=2023, month=8, day=4, hour=12, minute=30),
            end_datetime=dt.datetime(year=2023, month=8, day=4, hour=16, minute=30),
            owner=self.user,
        )
        self.event.members.set([self.user])
        self.other_user = User.objects.create(
            username="testttt@test.test", phone_number="+447123456788", family=family
        )
        self.guestlist_invite_update_view = GuestListInviteInviteeViewSet.as_view(
            {"patch": "update"}
        )

    @parameterized.expand(
        [
            ("Accept", {"accepted": True}),
            ("Reject", {"rejected": True}),
            ("Maybe", {"maybe": True}),
        ]
    )
    def test_can_respond_to_invite(self, _, req_fields):
        """test_can_respond_to_invite"""

        invite = GuestListInvite.objects.create(
            user=self.other_user, entity=self.event, sent=True
        )

        request = APIRequestFactory().patch(
            "",
            req_fields,
            format="json",
        )
        force_authenticate(request, self.other_user)

        self.assertEqual(
            GuestListInvite.objects.filter(user=self.other_user, accepted=True).count(),
            0,
        )
        self.assertEqual(
            GuestListInvite.objects.filter(user=self.other_user, rejected=True).count(),
            0,
        )
        self.assertEqual(
            GuestListInvite.objects.filter(user=self.other_user, maybe=True).count(), 0
        )

        res = self.guestlist_invite_update_view(request, pk=invite.pk)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        if req_fields.get("accepted"):
            self.assertEqual(
                GuestListInvite.objects.filter(
                    user=self.other_user, accepted=True
                ).count(),
                1,
            )

        if req_fields.get("rejected"):
            self.assertEqual(
                GuestListInvite.objects.filter(
                    user=self.other_user, rejected=True
                ).count(),
                1,
            )

        if req_fields.get("maybe"):
            self.assertEqual(
                GuestListInvite.objects.filter(
                    user=self.other_user, maybe=True
                ).count(),
                1,
            )
