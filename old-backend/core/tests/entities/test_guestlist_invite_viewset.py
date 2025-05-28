"""Test guestlist invite viewset"""

import datetime as dt
import logging
from typing import List
from unittest.mock import MagicMock, patch

import pytz
from django.conf import settings
from django.test import TestCase
from parameterized import parameterized  # type: ignore
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.social import Event, GuestListInvite
from core.models.users.user_models import Family, User
from core.utils.categories import Categories
from core.views.entity_viewsets import GuestListInviteViewSet
from notifications.models import PushToken

utc = pytz.UTC


logger = logging.getLogger(__name__)


class TestGuestlistInviteCreate(TestCase):
    """TestGuestlistInviteCreate"""

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
        self.guestlist_invite_create_view = GuestListInviteViewSet.as_view(
            {"post": "create"}
        )

    def test_can_create_guestlist_invite(self):
        """test_can_create_guestlist_invite"""
        request = APIRequestFactory().post(
            "", {"user": self.other_user.id, "entity": self.event.id}, format="json"
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            GuestListInvite.objects.filter(user=self.other_user).count(), 1
        )

    def test_can_create_guestlist_invites_for_phone_numbers(self):
        """test_can_create_guestlist_invites_for_phone_numbers"""
        test_phone = "+447123123123"
        request = APIRequestFactory().post(
            "", {"phone_number": test_phone, "entity": self.event.id}, format="json"
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            GuestListInvite.objects.filter(phone_number=test_phone).count(), 1
        )

        other_test_phone = "+447123123111"
        request = APIRequestFactory().post(
            "",
            {"phone_number": other_test_phone, "entity": self.event.id},
            format="json",
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            GuestListInvite.objects.filter(phone_number=other_test_phone).count(), 1
        )

    def test_can_create_guestlist_invite_for_email(self):
        """test_can_create_guestlist_invite_for_email"""
        test_email = "test@testtest.test"
        request = APIRequestFactory().post(
            "", {"email": test_email, "entity": self.event.id}, format="json"
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(GuestListInvite.objects.filter(email=test_email).count(), 1)

    def test_can_create_guestlist_invite_for_user_from_email(self):
        """test_can_create_guestlist_invite_for_user_from_email"""
        test_email = "test@testtest.test"

        existing_user = User.objects.create(email=test_email, username=test_email)

        request = APIRequestFactory().post(
            "", {"email": test_email, "entity": self.event.id}, format="json"
        )
        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(GuestListInvite.objects.filter(email=test_email).count(), 0)
        self.assertEqual(GuestListInvite.objects.filter(user=existing_user).count(), 1)

    def test_can_create_guestlist_invite_for_user_from_phone_number(self):
        """test_can_create_guestlist_invite_for_user_from_phone_number"""
        test_phone_number = "+447123123123"

        existing_user = User.objects.create(
            phone_number=test_phone_number, username=test_phone_number
        )

        request = APIRequestFactory().post(
            "",
            {"phone_number": test_phone_number, "entity": self.event.id},
            format="json",
        )
        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            GuestListInvite.objects.filter(phone_number=test_phone_number).count(), 0
        )
        self.assertEqual(GuestListInvite.objects.filter(user=existing_user).count(), 1)

    def test_cannot_create_guestlist_invite_for_random_event(self):
        """test_cannot_create_guestlist_invite_for_random_event"""
        some_user = User.objects.create(
            username="rando@test.test", phone_number="+447123456123"
        )
        event = Event.objects.create(
            name="Test Event",
            category=Categories.SOCIAL_INTERESTS.value,
            start_datetime=dt.datetime(year=2023, month=8, day=4, hour=12, minute=30),
            end_datetime=dt.datetime(year=2023, month=8, day=4, hour=16, minute=30),
            owner=some_user,
        )

        request = APIRequestFactory().post(
            "", {"user": self.other_user.id, "entity": event.id}, format="json"
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(
            res.data["entity"][0],
            f"User does not have permissions to invite members to entity {event.id}",
        )

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            GuestListInvite.objects.filter(user=self.other_user).count(), 0
        )

    def test_cannot_invite_same_user_twice(self):
        """test_cannot_invite_same_user_twice"""
        request = APIRequestFactory().post(
            "", {"user": self.other_user.id, "entity": self.event.id}, format="json"
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            GuestListInvite.objects.filter(user=self.other_user).count(), 1
        )

        request = APIRequestFactory().post(
            "", {"user": self.other_user.id, "entity": self.event.id}, format="json"
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        # Should get 400 response the second time
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # And still only one invite
        self.assertEqual(
            GuestListInvite.objects.filter(user=self.other_user).count(), 1
        )

    def test_cannot_invite_same_phone_number_twice(self):
        """test_cannot_invite_same_phone_number_twice"""
        test_phone_number = "+447123123123"
        request = APIRequestFactory().post(
            "",
            {"phone_number": test_phone_number, "entity": self.event.id},
            format="json",
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            GuestListInvite.objects.filter(phone_number=test_phone_number).count(), 1
        )

        request = APIRequestFactory().post(
            "",
            {"phone_number": test_phone_number, "entity": self.event.id},
            format="json",
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        # Should get 400 response the second time
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # And still only one invite
        self.assertEqual(
            GuestListInvite.objects.filter(phone_number=test_phone_number).count(), 1
        )

    def test_cannot_invite_same_email_twice(self):
        """test_cannot_invite_same_email_twice"""
        test_email = "test@testtest.com"
        request = APIRequestFactory().post(
            "",
            {"email": test_email, "entity": self.event.id},
            format="json",
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(GuestListInvite.objects.filter(email=test_email).count(), 1)

        request = APIRequestFactory().post(
            "",
            {"email": test_email, "entity": self.event.id},
            format="json",
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        # Should get 400 response the second time
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # And still only one invite
        self.assertEqual(GuestListInvite.objects.filter(email=test_email).count(), 1)

    def test_cannot_invite_uppercase_version_of_existing_email(self):
        """test_cannot_invite_uppercase_version_of_existing_email"""
        test_email = "test@testtest.com"
        request = APIRequestFactory().post(
            "",
            {"email": test_email, "entity": self.event.id},
            format="json",
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(GuestListInvite.objects.filter(email=test_email).count(), 1)

        request = APIRequestFactory().post(
            "",
            {"email": test_email.upper(), "entity": self.event.id},
            format="json",
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        # Should get 400 response the second time
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        # And still only one invite
        self.assertEqual(GuestListInvite.objects.filter(email=test_email).count(), 1)

    @parameterized.expand(
        [
            ("Accept", {"accepted": True}),
            ("Reject", {"rejected": True}),
            ("Maybe", {"maybe": True}),
        ]
    )
    def test_cannot_respond_to_invite_for_other_user(self, _, req_fields):
        """test_cannot_respond_to_invite_for_other_user"""
        request = APIRequestFactory().post(
            "",
            {"user": self.other_user.id, "entity": self.event.id, **req_fields},
            format="json",
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            GuestListInvite.objects.filter(user=self.other_user).count(), 1
        )
        self.assertEqual(GuestListInvite.objects.filter(accepted=True).count(), 0)
        self.assertEqual(GuestListInvite.objects.filter(rejected=True).count(), 0)
        self.assertEqual(GuestListInvite.objects.filter(maybe=True).count(), 0)

    @parameterized.expand(
        [
            ("user and email", {"user": "PLACEHOLDER", "email": "etstest@asdasd.ases"}),
            (
                "email and phone",
                {"phone_number": "+447111333777", "email": "etstest@asdasd.ases"},
            ),
            (
                "user and phone",
                {"user": "PLACEHOLDER", "phone_number": "+447111333777"},
            ),
            (
                "user and email and phone",
                {
                    "user": 1,
                    "email": "etstest@asdasd.ases",
                    "phone_number": "+447111333777",
                },
            ),
        ]
    )
    def test_cannot_create_with_multiple_user_fields(self, _, req_fields):
        """test_cannot_respond_to_invite_for_other_user"""
        if req_fields.get("user"):
            req_fields["user"] = self.other_user.pk

        request = APIRequestFactory().post(
            "",
            {"entity": self.event.id, **req_fields},
            format="json",
        )

        force_authenticate(request, self.user)

        res = self.guestlist_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        expected_error_message = (
            "Only one of user, email and phone_number may be provided"
        )
        self.assertEqual(res.data["email"][0], expected_error_message)
        self.assertEqual(res.data["phone_number"][0], expected_error_message)
        self.assertEqual(res.data["user"][0], expected_error_message)
        self.assertEqual(GuestListInvite.objects.all().count(), 0)


class TestGuestlistInviteSend(TestCase):
    """TestGuestlistInviteSend"""

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
        self.guestlist_invite_send_view = GuestListInviteViewSet.as_view(
            {"get": "send"}
        )
        self.guestlist_invite_send_for_entity_view = GuestListInviteViewSet.as_view(
            {"get": "send_for_entity"}
        )

    @patch("core.views.entity_viewsets.send_push_message_if_valid")
    def test_send_invite_to_existing_user(self, msend_message):
        """test_send_invite_to_existing_user"""
        invite = GuestListInvite.objects.create(entity=self.event, user=self.other_user)
        existing_token = PushToken.objects.create(
            token="SDFSDFSDF", user=self.other_user
        )

        request = APIRequestFactory().get("")
        force_authenticate(request, self.user)

        res = self.guestlist_invite_send_view(request, pk=invite.pk)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        invite.refresh_from_db()
        self.assertTrue(invite.sent)

        msend_message.assert_called_once_with(
            existing_token,
            "You have been invited to an event!",
        )

    @patch("core.views.entity_viewsets.Client")
    def test_send_invite_to_phone(self, mtwilio_client):
        """test_send_invite_to_phone"""
        mtwilio_client.return_value.messages.create = MagicMock()

        test_phone = "+447234234234"
        invite = GuestListInvite.objects.create(
            entity=self.event, phone_number=test_phone
        )

        request = APIRequestFactory().get("")
        force_authenticate(request, self.user)

        res = self.guestlist_invite_send_view(request, pk=invite.pk)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        invite.refresh_from_db()
        self.assertTrue(invite.sent)

        mtwilio_client.return_value.messages.create.assert_called_once_with(
            to=str(test_phone),
            from_=settings.TWILIO_FROM_NUMBER,
            body="You have been invited to an event on Vuet!\n\nDownload the app from the app store now and sign up with this phone number to join in",
        )

    @patch("core.views.entity_viewsets.EmailClient")
    def test_send_invite_to_email(self, memail):
        """test_send_invite_to_email"""
        memail.return_value.send_email = MagicMock()

        test_email = "test@testsetset.test"
        invite = GuestListInvite.objects.create(entity=self.event, email=test_email)

        request = APIRequestFactory().get("")
        force_authenticate(request, self.user)

        res = self.guestlist_invite_send_view(request, pk=invite.pk)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        invite.refresh_from_db()
        self.assertTrue(invite.sent)

        memail.return_value.send_email.assert_called_once_with(
            "You have been invited to an event",
            "event-invite-new.html",
            test_email,
            plaintext_template="event-invite-new.txt",
        )

    @patch("core.views.entity_viewsets.send_push_message_if_valid")
    @patch("core.views.entity_viewsets.Client")
    @patch("core.views.entity_viewsets.EmailClient")
    def test_send_all_entity_invites(self, memail, mtwilio_client, msend_message):
        """test_send_all_entity_invites"""
        memail.return_value.send_email = MagicMock()

        num_email_invites = 7
        email_invites: List[GuestListInvite] = []
        for i in range(num_email_invites):
            test_email = f"test{i}@testsetset.test"
            email_invite = GuestListInvite.objects.create(
                entity=self.event, email=test_email
            )
            email_invites.append(email_invite)

        num_phone_invites = 5
        phone_invites: List[GuestListInvite] = []
        for i in range(num_phone_invites):
            test_phone = f"+44716716716{i}"
            phone_invite = GuestListInvite.objects.create(
                entity=self.event, phone_number=test_phone
            )
            phone_invites.append(phone_invite)

        num_user_invites = 3
        user_invites: List[GuestListInvite] = []
        for i in range(num_user_invites):
            user_phone = f"+44716716716{i}"
            user = User.objects.create(username=user_phone, phone_number=user_phone)
            PushToken.objects.create(token="SDFSDFSDF", user=user)
            user_invite = GuestListInvite.objects.create(entity=self.event, user=user)
            user_invites.append(user_invite)

        request = APIRequestFactory().get("")
        force_authenticate(request, self.user)

        res = self.guestlist_invite_send_for_entity_view(request, pk=self.event.pk)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        for invite in phone_invites + email_invites + user_invites:
            invite.refresh_from_db()
            self.assertTrue(invite.sent)

        self.assertEqual(memail.return_value.send_email.call_count, num_email_invites)
        self.assertEqual(
            mtwilio_client.return_value.messages.create.call_count, num_phone_invites
        )
        self.assertEqual(msend_message.call_count, num_user_invites)
