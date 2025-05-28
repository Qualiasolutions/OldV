from django.test import TestCase
from rest_framework import status
from core.models.users.user_models import User

from core.views.settings_views import BirthdayBlockedCategoryViewset, FamilyCategoryViewPermissionViewset
from rest_framework.test import APIRequestFactory, force_authenticate


class TestBirthdayBlockedDaysViewset(TestCase):
    def setUp(self):
        self.create_view = BirthdayBlockedCategoryViewset.as_view({"post": "create"})
        test_phone = "+447814123123"
        self.user = User.objects.create(phone_number=test_phone, username=test_phone)

    def test_can_create_family_view_permission(self):
        """Test that we can create family view permissions for categories"""
        req = APIRequestFactory().post("", {
            "user": self.user.id,
            "category": 2
        }, format="json")

        force_authenticate(req, self.user)

        res = self.create_view(req)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
