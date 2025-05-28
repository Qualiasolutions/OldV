import datetime as dt
import logging

import pytz
from dateutil import parser
from dateutil.tz import tzlocal
from django.test import TestCase
from parameterized import parameterized  # type: ignore
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity
from core.models.settings.blocked_days import BirthdayBlockedCategory
from core.models.tasks.alerts import Alert
from core.models.tasks.base import FixedTask, Recurrence, Task
from core.models.users.user_models import Family, User
from core.tests.utils.create_blocked_days import create_blocked_days
from core.utils.categories import Categories
from core.views.task_viewsets import FlexibleFixedTaskViewSet, TaskViewSet

utc = pytz.UTC

logger = logging.getLogger(__name__)


class TestFlexibleFixedTaskViewSet(TestCase):
    """TestFlexibleFixedTaskViewSet"""

    def setUp(self):
        self.create_view = FlexibleFixedTaskViewSet.as_view({"post": "create"})
        self.user_phone = "+447814187440"
        self.family = Family.objects.create()
        self.user = User.objects.create(
            phone_number=self.user_phone, username=self.user_phone, family=self.family
        )
        self.entity = Entity.objects.create(
            name="__TEST_ENTITY__",
            owner=self.user,
            category=Categories.TRANSPORT.value,
        )

    def test_can_create_fixed_task_from_flexible_params(self):
        """Test that we can create a fixed task from the
        flexible task parameters provided
        """

        req = APIRequestFactory().post(
            "",
            {
                "title": "__TEST_TASK__",
                "earliest_action_date": "2023-01-01T00:00:00Z",
                "due_date": "2023-01-08T00:00:00Z",
                "duration": 30,
                "members": [self.user.id],
                "entities": [self.entity.id],
            },
            format="json",
        )

        force_authenticate(req, self.user)

        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["start_datetime"], "2023-01-01T08:00:00Z")
        self.assertEqual(res.data["end_datetime"], "2023-01-01T08:30:00Z")
        self.assertTrue(FixedTask.objects.filter(id=res.data["id"]).exists())

    @parameterized.expand(
        [
            (
                "Makes blocked task alerts for self",
                {
                    "req": {
                        "earliest_action_date": "2023-01-01",
                        "due_date": "2023-01-01",
                        "duration": 30,
                    },
                    "blocked_days": {
                        "birthdays": {
                            "date": parser.parse("2023-01-01").date(),
                            "category": Categories.TRANSPORT.value,
                        },
                    },
                    "expected_alerts": ["BLOCKED_DAY"],
                },
                {
                    "start_datetime": "2023-01-01T08:00:00Z",
                    "end_datetime": "2023-01-01T08:30:00Z",
                },
            ),
            (
                "Makes blocked task alerts for other users",
                {
                    "req": {
                        "earliest_action_date": "2023-01-01",
                        "due_date": "2023-01-01",
                        "duration": 30,
                    },
                    "other_users": [
                        {
                            "blocked_days": {
                                "birthdays": {
                                    "date": parser.parse("2023-01-01").date(),
                                    "category": Categories.TRANSPORT.value,
                                },
                            },
                            "expected_alerts": ["BLOCKED_DAY"],
                        },
                    ],
                },
                {
                    "start_datetime": "2023-01-01T08:00:00Z",
                    "end_datetime": "2023-01-01T08:30:00Z",
                },
            ),
            (
                "Makes task conflict alerts for self",
                {
                    "req": {
                        "earliest_action_date": "2023-01-01",
                        "due_date": "2023-01-01",
                        "duration": 30,
                    },
                    "fixed_tasks": [
                        {
                            "task": {  # all day task should conflict with flex task
                                "title": "FamilyMemberTask",
                                "start_datetime": parser.parse("2023-01-01T01:00:00Z"),
                                "end_datetime": parser.parse("2023-01-01T23:00:00Z"),
                            }
                        },
                    ],
                    "expected_alerts": ["TASK_CONFLICT"],
                },
                {
                    "start_datetime": "2023-01-01T08:00:00Z",
                    "end_datetime": "2023-01-01T08:30:00Z",
                },
            ),
        ]
    )
    def test_alerts_created(self, _, opts, expected):
        """Test that we can create a fixed task from the
        flexible task parameters provided
        """

        user_blocked_days = opts.get("blocked_days")
        if user_blocked_days:
            create_blocked_days(user_blocked_days, self.user)

        premade_fixed_tasks = opts.get("fixed_tasks")
        if premade_fixed_tasks:
            for fixed_task in premade_fixed_tasks:
                task = FixedTask.objects.create(**fixed_task["task"])
                task.entities.add(self.entity)
                task.members.add(self.user)
                task.save()

        members = [self.user.id]
        other_users = []
        if opts.get("other_users"):
            for i, other_user_conf in enumerate(opts.get("other_users")):
                other_user = User.objects.create(
                    username="__OTHER_USER__",
                    phone_number=f"+44734567812{i}",
                    family=self.family,
                )
                other_users.append(other_user)
                members.append(other_user.id)
                other_user_blocked_days = other_user_conf.get("blocked_days")
                if other_user_blocked_days:
                    create_blocked_days(other_user_blocked_days, other_user)

        req = APIRequestFactory().post(
            "",
            {
                "title": "__TEST_TASK__",
                "members": members,
                "entities": [self.entity.id],
                **opts.get("req"),
            },
            format="json",
        )

        force_authenticate(req, self.user)

        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["start_datetime"], expected["start_datetime"])
        self.assertEqual(res.data["end_datetime"], expected["end_datetime"])

        new_task = FixedTask.objects.get(id=res.data["id"])

        user_expected_alerts = opts.get("expected_alerts")
        if user_expected_alerts:
            for type in user_expected_alerts:
                # Just needs to successfully retrieve this
                Alert.objects.get(task=new_task, user=self.user, type=type)

        if opts.get("other_users"):
            for other_user, other_user_conf in zip(
                other_users, opts.get("other_users")
            ):
                other_user_expected_alerts = other_user_conf.get("expected_alerts")
                if other_user_expected_alerts:
                    for type in other_user_expected_alerts:
                        # Just needs to successfully retrieve this
                        Alert.objects.get(task=new_task, user=other_user, type=type)
