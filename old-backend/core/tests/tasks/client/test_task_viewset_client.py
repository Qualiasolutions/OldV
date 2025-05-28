"""Client tests for task viewset"""
import json
import logging

import pytz
from django.test import TestCase
from django.urls import reverse
from parameterized import parameterized  # type: ignore
from rest_framework import status

from core.models.entities.base import Entity
from core.models.users.user_models import Family, User
from core.utils.categories import Categories

utc = pytz.UTC

logger = logging.getLogger(__name__)


class TestTaskViewSetClient(TestCase):
    """TestTaskViewSetClient"""

    def setUp(self):
        family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=family
        )
        self.family_member = User.objects.create(
            username="family@test.test", phone_number="+447123456749", family=family
        )

        self.user_entity = Entity.objects.create(
            name="Test Entity",
            owner=self.user,
            category=Categories.TRANSPORT.value,
        )

        self.url = reverse("task-list")

    @parameterized.expand(
        [
            (
                "Fixed task with recurrence",
                {
                    "title": "Test task",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "members": ["user", "family_member"],
                    "recurrence": {
                        "recurrence": "WEEKLY",
                        "earliest_occurrence": "2022-10-10T10:00:00Z",
                        "latest_occurrence": None,
                    },
                },
                {
                    "title": "Test task",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "recurrence": {
                        "recurrence": "WEEKLY",
                        "earliest_occurrence": "2022-10-10T10:00:00Z",
                        "latest_occurrence": None,
                        "interval_length": 1,
                    },
                },
            ),
            (
                "Fixed task with NULL recurrence",
                {
                    "title": "Test task",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "members": ["user", "family_member"],
                    "recurrence": None,
                },
                {
                    "title": "Test task",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "recurrence": None,
                },
            ),
        ]
    )
    def test_can_create_tasks(self, _, task, expected_response):
        """Test that we can successfully create tasks"""
        if task.get("members"):
            task_members = task.pop("members")
            task["members"] = [
                getattr(self, member_name).id for member_name in task_members
            ]

        self.client.force_login(self.user)
        res = self.client.post(
            self.url,
            data=json.dumps(
                {
                    **task,
                    "entities": [self.user_entity.id],
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        res_data = res.json()
        expected_recurrence = expected_response.pop("recurrence")
        if expected_recurrence:
            self.assertEqual(
                dict(res_data["recurrence"]),
                {
                    **expected_recurrence,
                    "task": res_data["id"],
                    "id": res_data["recurrence"]["id"],
                },
            )
        else:
            self.assertEqual(res_data["recurrence"], None)

        for key in expected_response:
            self.assertEqual(res_data[key], expected_response[key])
