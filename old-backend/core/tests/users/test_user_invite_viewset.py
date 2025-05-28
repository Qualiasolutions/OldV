import logging
from typing import Any, Dict
from unittest.mock import MagicMock, patch

from django.conf import settings
from django.test import TestCase
from parameterized import parameterized  # type: ignore
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.users.user_models import Family, User, UserInvite
from core.views.user_viewsets import UserInviteViewSet

logger = logging.getLogger(__name__)


class TestUserInviteViewSet(TestCase):
    """Tests for the user invite viewset"""

    def setUp(self):
        self.user_invite_create_view = UserInviteViewSet.as_view({"post": "create"})
        self.user_invite_update_view = UserInviteViewSet.as_view(
            {"patch": "partial_update"}
        )

        self.family = Family.objects.create()

        test_phone_number = "+447123123123"
        self.user = User.objects.create(
            username=test_phone_number,
            phone_number=test_phone_number,
            family=self.family,
            first_name="__first_name__",
            last_name="__last_name__",
        )

        # Make a couple of users to begin with
        User.objects.create(phone_number="+44123789567", username="+44123789567")
        User.objects.create(email="existing@test.com", username="existing@test.com")

    @patch("core.models.users.signals.Client")
    def test_cannot_send_invite_to_arbitrary_family(self, mtwilio_client):
        """Test cannot invite a user to an arbitrary family"""
        twilio_client = MagicMock()
        mtwilio_client.return_value = twilio_client

        test_phone_number = "+447814123456"
        self.user.family = None
        self.user.save()

        # Invalid request gives 400 response
        request = APIRequestFactory().post(
            "",
            {
                "family": self.family.id,
                "invitee": self.user.id,
                "phone_number": test_phone_number,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        res = self.user_invite_create_view(request)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["family"]["code"], "user_has_no_family")

        mtwilio_client.assert_not_called()

    @parameterized.expand(
        [
            (
                "Family invite to new user",
                {
                    "existing_user": False,
                    "family_invite": True,
                    "test_family_first_name": "__family_first_name__",
                    "test_family_last_name": "__family_last_name__",
                    "test_family_phone_number": "+447123121111",
                },
                "Hello __family_first_name__!\n\n__first_name__ __last_name__ has invited you to their Vuet family.\n\nDownload the app from the app store now and sign up with the phone number ending 1111 to join them!",
            ),
            (
                "Family invite to existing user",
                {
                    "existing_user": True,
                    "family_invite": True,
                    "test_family_first_name": "__family_first_name__",
                    "test_family_last_name": "__family_last_name__",
                    "test_family_phone_number": "+447123122222",
                },
                "Hello __family_first_name__!\n\n__first_name__ __last_name__ has invited you to their Vuet family.\nLog in to your account now to join them!",
            ),
            (
                "Friend invite to new user",
                {
                    "existing_user": False,
                    "family_invite": False,
                    "test_family_first_name": "__family_first_name__",
                    "test_family_last_name": "__family_last_name__",
                    "test_family_phone_number": "+447123123333",
                },
                "Hello __family_first_name__!\n\n__first_name__ __last_name__ has invited you to their Vuet circle.\n\nDownload the app from the app store now and sign up with the phone number ending 3333 to join them!",
            ),
            (
                "Friend invite to existing user",
                {
                    "existing_user": True,
                    "family_invite": False,
                    "test_family_first_name": "__family_first_name__",
                    "test_family_last_name": "__family_last_name__",
                    "test_family_phone_number": "+447123124444",
                },
                "Hello __family_first_name__!\n\n__first_name__ __last_name__ has invited you to their Vuet circle.\nLog in to your account now to join them!",
            ),
            (
                "Family invite using email to existing user",
                {
                    "existing_user": True,
                    "family_invite": True,
                    "email_invite": True,
                    "test_family_first_name": "__family_first_name__",
                    "test_family_last_name": "__family_last_name__",
                    "test_family_email": "test@test.com",
                },
                "Hello __family_first_name__!\n\n__first_name__ __last_name__ has invited you to their Vuet circle.\nLog in to your account now to join them!",
            ),
            (
                "Family invite using email to new user",
                {
                    "existing_user": False,
                    "family_invite": True,
                    "email_invite": True,
                    "test_family_first_name": "__family_first_name__",
                    "test_family_last_name": "__family_last_name__",
                    "test_family_email": "test@test.com",
                },
                "Hello __family_first_name__!\n\n__first_name__ __last_name__ has invited you to their Vuet circle.\nLog in to your account now to join them!",
            ),
        ]
    )
    @patch("core.models.users.signals.Client")
    @patch("core.models.users.signals.EmailClient")
    def test_can_send_invite(
        self, _, options, expected_text_message, memail, mtwilio_client
    ):
        """Test can send user invites"""
        twilio_client = MagicMock()
        mtwilio_client.return_value = twilio_client
        memail.return_value.send_email = MagicMock()

        if options["existing_user"]:
            user_vals = {
                "first_name": options["test_family_first_name"],
                "last_name": options["test_family_last_name"],
            }
            if options.get("test_family_phone_number"):
                user_vals["phone_number"] = options["test_family_phone_number"]
                user_vals["username"] = options["test_family_phone_number"]
            if options.get("test_family_email"):
                user_vals["email"] = options["test_family_email"]
                user_vals["username"] = options["test_family_email"]

            User.objects.create(**user_vals)

        body = {
            "invitee": self.user.id,
            "first_name": options["test_family_first_name"],
            "last_name": options["test_family_last_name"],
        }

        if options["family_invite"]:
            body["family"] = self.family.id

        if options.get("test_family_phone_number"):
            body["phone_number"] = options["test_family_phone_number"]

        if options.get("test_family_email"):
            body["email"] = options["test_family_email"]

        # Valid request gives 201 response and tokens
        request = APIRequestFactory().post("", body, format="json")
        force_authenticate(request, user=self.user)

        res = self.user_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        if options["family_invite"]:
            self.assertEqual(res.data["family"], self.family.id)
        else:
            self.assertEqual(res.data["family"], None)

        if options.get("email_invite"):
            if options["existing_user"]:
                memail.return_value.send_email.assert_called_once()
                memail.return_value.send_email.assert_called_with(
                    "You have been invited to a family",
                    "family-invite-existing.html",
                    options.get("test_family_email"),
                    plaintext_template="family-invite-existing.txt",
                    data={
                        "inviter_name": "__first_name__ __last_name__",
                        "invitee_name": "__family_first_name__",
                    },
                )
            else:
                memail.return_value.send_email.assert_called_once()
                memail.return_value.send_email.assert_called_with(
                    "You have been invited to join Vuet",
                    "family-invite-new.html",
                    options.get("test_family_email"),
                    plaintext_template="family-invite-new.txt",
                    data={
                        "inviter_name": "__first_name__ __last_name__",
                    },
                )
        else:
            twilio_client.messages.create.assert_called_once()
            twilio_client.messages.create.assert_called_with(
                to=options["test_family_phone_number"],
                from_=settings.TWILIO_FROM_NUMBER,
                body=expected_text_message,
            )

    @parameterized.expand(
        [
            ("Phone number invite", False),
            ("Email invite", True),
        ]
    )
    @patch("core.models.users.signals.Client")
    @patch("core.models.users.signals.EmailClient")
    def test_cannot_invite_already_invited_user(
        self, _, using_email, memail, mtwilio_client
    ):
        """Test that a user cannot be invited if they have already been
        invited to a family
        """
        test_invite_phone_number = "+447111222333"
        test_email = "test@test.com"

        user_opts: Dict[str, Any] = {
            "family": self.family,
            "invitee": self.user,
        }

        if using_email:
            user_opts["email"] = test_email
        else:
            user_opts["phone_number"] = test_invite_phone_number

        UserInvite.objects.create(**user_opts)

        memail.return_value.send_email = MagicMock()
        mtwilio_client.return_value.messages.create = MagicMock()

        body: Dict[str, Any] = {
            "invitee": self.user.id,
            "family": self.family.id,
        }

        if using_email:
            body["email"] = test_email
        else:
            body["phone_number"] = test_invite_phone_number

        request = APIRequestFactory().post("", body, format="json")
        force_authenticate(request, user=self.user)

        res = self.user_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

        if using_email:
            self.assertEqual(res.data["email"]["code"], "already_invited")
        else:
            self.assertEqual(res.data["phone_number"]["code"], "already_invited")

        memail.return_value.send_email.assert_not_called()
        mtwilio_client.return_value.messages.create.assert_not_called()

    @patch("core.models.users.signals.Client")
    def test_cannot_invite_user_who_already_has_a_family(self, mtwilio_client):
        """Test that a user cannot be invited if they are already
        in another family with more that one user
        """
        test_invite_phone_number_1 = "+447111111111"
        test_invite_phone_number_2 = "+447222222222"
        family = Family.objects.create()
        User.objects.create(
            phone_number=test_invite_phone_number_1,
            username=test_invite_phone_number_1,
            family=family,
        )
        User.objects.create(
            phone_number=test_invite_phone_number_2,
            username=test_invite_phone_number_2,
            family=family,
        )

        body = {
            "invitee": self.user.id,
            "phone_number": test_invite_phone_number_1,
            "family": self.family.id,
        }

        request = APIRequestFactory().post("", body, format="json")
        force_authenticate(request, user=self.user)

        res = self.user_invite_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["phone_number"]["code"], "already_has_family")

    @patch("core.models.users.signals.Client")
    def test_cannot_invite_user_who_is_already_in_family(self, mtwilio_client):
        """Test that a user cannot be invited if they are already
        in the family
        """
        test_invite_phone_number = "+447111111111"
        User.objects.create(
            phone_number=test_invite_phone_number,
            username=test_invite_phone_number,
            family=self.family,
        )

        body = {
            "invitee": self.user.id,
            "phone_number": test_invite_phone_number,
            "family": self.family.id,
        }

        request = APIRequestFactory().post("", body, format="json")
        force_authenticate(request, user=self.user)

        res = self.user_invite_create_view(request)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["phone_number"]["code"], "already_in_family")

    @patch("core.models.users.signals.Client")
    def test_can_reject_invite(self, mtwilio_client):
        """Test that a user can reject an invite"""
        test_phone_number = "+447123456789"
        user = User.objects.create(
            phone_number=test_phone_number, username=test_phone_number
        )
        user_invite = UserInvite.objects.create(
            phone_number=test_phone_number, invitee=self.user
        )

        request = APIRequestFactory().patch(
            "", {"id": user_invite.id, "rejected": True}, format="json"
        )
        force_authenticate(request, user=user)

        res = self.user_invite_update_view(request, pk=user_invite.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

    @patch("core.models.users.signals.Client")
    def test_can_accept_invite(self, mtwilio_client):
        """Test that a user can accept an invite"""
        test_phone_number = "+447123456789"
        user = User.objects.create(
            phone_number=test_phone_number, username=test_phone_number
        )
        user_invite = UserInvite.objects.create(
            phone_number=test_phone_number, invitee=self.user
        )

        request = APIRequestFactory().patch(
            "", {"id": user_invite.id, "accepted": True}, format="json"
        )
        force_authenticate(request, user=user)

        res = self.user_invite_update_view(request, pk=user_invite.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
