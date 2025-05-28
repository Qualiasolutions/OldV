from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from core.models.users.user_models import User


class TestPreferredDaysViewsetClient(TestCase):
    def setUp(self):
        test_phone = "+447814123123"
        self.user = User.objects.create(phone_number=test_phone, username=test_phone)
        self.url = reverse("preferred-days-list")

    def test_can_get_response(self):
        """Test that we can successfully get a list"""
        self.client.force_login(self.user)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
