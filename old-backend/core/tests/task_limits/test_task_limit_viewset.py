import logging
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate
from core.models.users.user_models import User

from core.views.task_limit_viewsets import TaskLimitViewSet


logger = logging.getLogger(__name__)


class TestTaskLimitViewset(TestCase):
    def setUp(self):
        self.create_view = TaskLimitViewSet.as_view({"post": "create"})
        self.update_view = TaskLimitViewSet.as_view({"patch": "partial_update"})
        test_phone = "+447814123123"
        self.user = User.objects.create(phone_number=test_phone, username=test_phone)

    def test_can_create_task_limit(self):
        """Test that we can create tasks"""
        req = APIRequestFactory().post("", {
            "user": self.user.id,
            "category": 2,
            "minutes_limit": 20,
            "tasks_limit": None,
            "interval": "DAILY"
        }, format="json")
        force_authenticate(req, self.user)

        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
