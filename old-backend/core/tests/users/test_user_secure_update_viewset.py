"""user viewset tests"""

import logging

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.users.user_models import User
from core.views.user_viewsets import UserSecureUpdateViewSet
from vuet_auth.models.forgot_password_validations import ForgotPasswordValidation

logger = logging.getLogger(__name__)


class TestUserSecureUpdateViewSetViewSet(TestCase):
    """TestUserSecureUpdateViewSetViewSet"""

    def setUp(self):
        self.update_view = UserSecureUpdateViewSet.as_view({"patch": "partial_update"})

        phone_number = "+447814187440"
        self.user = User.objects.create(
            username=phone_number, phone_number=phone_number
        )

        self.current_password = "CURRENT_PASSWORD"
        self.user.set_password(self.current_password)
        self.user.save()

    def test_cannot_update_password_without_old_password(self):
        """Test that the password cannot be updated without providing the current password"""
        req = APIRequestFactory().patch("", {"password": "__NEW_PASSWORD__"})
        force_authenticate(req, self.user)

        res = self.update_view(req, pk=self.user.id)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["old_password"]["code"], "no_old_password")

    def test_cannot_update_password_with_incorrect_old_password(self):
        """Test that the password cannot be updated without providing the current password"""
        req = APIRequestFactory().patch(
            "", {"password": "__NEW_PASSWORD__", "old_password": "__INCORRECT__"}
        )
        force_authenticate(req, self.user)

        res = self.update_view(req, pk=self.user.id)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["old_password"]["code"], "invalid_old_password")

    def test_can_update_password_with_correct_old_password(self):
        """Test that the password can be updated with the correct current password"""

        new_password = "__NEW_PASSWORD__"
        req = APIRequestFactory().patch(
            "", {"password": new_password, "old_password": self.current_password}
        )
        force_authenticate(req, self.user)

        res = self.update_view(req, pk=self.user.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))

    def test_can_update_password_with_correct_validation_code(self):
        """Test that the password can be updated with the correct validation code"""

        test_code = "123123"
        ForgotPasswordValidation.objects.create(code=test_code, user=self.user)

        new_password = "__NEW_PASSWORD__"
        req = APIRequestFactory().patch(
            "", {"password": new_password, "reset_password_code": test_code}
        )
        force_authenticate(req, self.user)

        res = self.update_view(req, pk=self.user.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password(new_password))

    def test_cannot_update_password_with_incorrect_validation_code(self):
        """Test that the password cannot be updated without providing the correct validation code"""
        test_code = "123123"
        ForgotPasswordValidation.objects.create(code=test_code, user=self.user)

        req = APIRequestFactory().patch(
            "", {"password": "__NEW_PASSWORD__", "reset_password_code": "111111"}
        )
        force_authenticate(req, self.user)

        res = self.update_view(req, pk=self.user.id)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res.data["reset_password_code"]["code"], "invalid_reset_password_code"
        )
