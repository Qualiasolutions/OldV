from django.test import TestCase
from rest_framework import status
from core.models.users.user_models import User

from core.views.settings_views import PreferredDaysViewset
from rest_framework.test import APIRequestFactory, force_authenticate


class TestPreferredDaysViewset(TestCase):
    def setUp(self):
        self.create_view = PreferredDaysViewset.as_view({"post": "create"})
        test_phone = "+447814123123"
        self.user = User.objects.create(phone_number=test_phone, username=test_phone)

    def test_can_create_preferred_days(self):
        """Test that we can create preferred days objects for categories"""
        req = APIRequestFactory().post("", {
            "user": self.user.id,
            "category": 2,
            "monday": True,
            "tuesday": True,
            "wednesday": True,
            "thursday": True,
            "friday": True,
        }, format="json")

        force_authenticate(req, self.user)

        res = self.create_view(req)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
