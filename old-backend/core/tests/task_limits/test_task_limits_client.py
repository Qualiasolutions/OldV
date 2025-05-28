import logging

import pytz
from django.test import TestCase
from django.urls import reverse
from rest_framework import status

from core.models.users.user_models import Family, User

utc = pytz.UTC

logger = logging.getLogger(__name__)


class TestTaskLimitViewSetClient(TestCase):
    def setUp(self):
        family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=family
        )
        self.url = reverse("task-limit-list")

    def test_can_get_response(self):
        """Test that we can successfully get a list"""
        self.client.force_login(self.user)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
