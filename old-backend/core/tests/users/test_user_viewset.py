"""user viewset tests"""

import logging
from datetime import datetime, timedelta
from typing import cast
from unittest.mock import patch

from django.core.files import File
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from parameterized import parameterized  # type: ignore
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.tasks.holidays import HolidayTask
from core.models.users.user_models import Family, User, UserInvite
from core.views.user_viewsets import UserViewSet
from vuet_auth.models.phone_validations import PhoneValidation

logger = logging.getLogger(__name__)


class TestUserViewSet(TestCase):
    """TestUserViewSet"""

    def test_cannot_update_family_without_invite(self):
        """test_cannot_update_family_without_invite"""
        user_update_view = UserViewSet.as_view({"patch": "partial_update"})

        test_phone_number = "+447814123456"
        user = User.objects.create(phone_number=test_phone_number)
        family = Family.objects.create()

        # Invalid request gives 400 response
        request = APIRequestFactory().patch("", {"family": family.id}, format="json")
        force_authenticate(request, user=user)

        res = user_update_view(request, pk=user.id)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["family"]["code"], "user_not_invited")

    @patch("core.models.users.signals.Client")
    def test_can_update_family_with_invite(self, _):
        """test_can_update_family_with_invite

        - Test that HolidayTask objects are assigned to a new family member
        """
        test_phone_number = "+447814123555"
        test_new_phone_number = "+447123123678"
        family = Family.objects.create()
        user = User.objects.create(
            username=test_phone_number, phone_number=test_phone_number, family=family
        )

        holiday_task = HolidayTask.objects.create(
            title="TEST_HOLIDAY_TASK",
            start_date="2020-01-01",
            end_date="2020-01-01",
            tags=["SOCIAL_INTERESTS__HOLIDAY"],
        )
        holiday_task.members.set([user])

        old_family = Family.objects.create()
        new_user = User.objects.create(
            username=test_new_phone_number,
            phone_number=test_new_phone_number,
            family=old_family,
        )

        UserInvite.objects.create(
            family=family, phone_number=test_new_phone_number, invitee=user
        )

        user_update_view = UserViewSet.as_view({"patch": "partial_update"})

        # Valid request gives 200 response
        request = APIRequestFactory().patch("", {"family": family.id}, format="json")
        force_authenticate(request, user=new_user)

        res = user_update_view(request, pk=new_user.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertEqual(user.family, family)

        holiday_task.refresh_from_db()
        self.assertTrue(new_user in holiday_task.members.all())

    def test_profile_pic_upload(self):
        """test_profile_pic_upload"""
        factory = APIRequestFactory()
        test_phone_number = "+447814123456"
        user = User.objects.create(
            username=test_phone_number, phone_number=test_phone_number
        )
        user_update_view = UserViewSet.as_view({"patch": "partial_update"})

        with open("core/tests/assets/cat.jpg", "rb") as img_file:
            uploaded_file = SimpleUploadedFile("cat.jpg", File(img_file).read())
            request = factory.patch("", {"profile_image": uploaded_file})
            force_authenticate(request, user)
            res = user_update_view(request, pk=user.id)

            self.assertEqual(res.status_code, status.HTTP_200_OK)

        user_retrieve_view = UserViewSet.as_view({"get": "retrieve"})
        retrieve_request = factory.get("")
        force_authenticate(retrieve_request, user)
        res = user_retrieve_view(retrieve_request, pk=user.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["presigned_profile_image_url"])

    def test_cannot_update_phone_without_validation(self):
        """test_cannot_update_phone_without_validation"""
        test_phone_number = "+447814123456"
        test_new_phone_number = "+447123123123"
        user = User.objects.create(
            username=test_phone_number, phone_number=test_phone_number
        )
        user_update_view = UserViewSet.as_view({"patch": "partial_update"})

        # Invalid request gives 400 response
        request = APIRequestFactory().patch(
            "", {"phone_number": test_new_phone_number}, format="json"
        )
        force_authenticate(request, user=user)

        res = user_update_view(request, pk=user.id)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["phone_number"]["code"], "unvalidated_number")

    def test_cannot_update_phone_with_old_validation(self):
        """test_cannot_update_phone_with_old_validation"""
        test_phone_number = "+447814123456"
        test_new_phone_number = "+447123123123"
        user = User.objects.create(
            username=test_phone_number, phone_number=test_phone_number
        )
        user_update_view = UserViewSet.as_view({"patch": "partial_update"})

        validation = PhoneValidation.objects.create(
            phone_number=test_new_phone_number, validated=True
        )
        PhoneValidation.objects.filter(id=validation.id).update(
            created_at=datetime.now() - timedelta(days=2)
        )
        validation.refresh_from_db()

        # Invalid request gives 400 response
        request = APIRequestFactory().patch(
            "", {"phone_number": test_new_phone_number}, format="json"
        )
        force_authenticate(request, user=user)

        res = user_update_view(request, pk=user.id)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["phone_number"]["code"], "unvalidated_number")

    @parameterized.expand(
        [
            ("+447123123123",),
            ("+447123 123123",),
            ("+44 7123 123 123",),
        ]
    )
    def test_cannot_update_phone_to_existing_number(self, test_new_phone_number):
        """test_cannot_update_phone_to_existing_number"""
        test_phone_number = "+447814123456"
        user = User.objects.create(
            username=test_phone_number, phone_number=test_phone_number
        )
        User.objects.create(
            username=test_new_phone_number.replace(" ", ""),
            phone_number=test_new_phone_number.replace(" ", ""),
        )
        user_update_view = UserViewSet.as_view({"patch": "partial_update"})

        PhoneValidation.objects.create(
            phone_number=test_new_phone_number.replace(" ", ""), validated=True
        )

        # Invalid request gives 400 response
        request = APIRequestFactory().patch(
            "", {"phone_number": test_new_phone_number}, format="json"
        )
        force_authenticate(request, user=user)

        res = user_update_view(request, pk=user.id)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res.data["phone_number"][0], "user with this phone number already exists."
        )

    def test_can_update_phone_with_validation(self):
        """test_can_update_phone_with_validation"""
        test_phone_number = "+447814123456"
        test_new_phone_number = "+447123123123"
        user = User.objects.create(
            username=test_phone_number, phone_number=test_phone_number
        )
        user_update_view = UserViewSet.as_view({"patch": "partial_update"})

        PhoneValidation.objects.create(
            phone_number=test_new_phone_number, validated=True
        )

        # Valid request gives 200 response
        request = APIRequestFactory().patch(
            "", {"phone_number": test_new_phone_number}, format="json"
        )
        force_authenticate(request, user=user)

        res = user_update_view(request, pk=user.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        user.refresh_from_db()
        self.assertEqual(user.phone_number, test_new_phone_number)
