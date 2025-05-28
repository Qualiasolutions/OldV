"""Tests for task viewset"""

import datetime as dt
import json
import logging

from dateutil import parser
from dateutil.tz import tzlocal
from django.test import TestCase
from django.urls import reverse
from parameterized import parameterized  # type: ignore
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity
from core.models.settings.blocked_days import BirthdayBlockedCategory
from core.models.settings.family_visibility import FamilyCategoryViewPermission
from core.models.tasks.alerts import ActionAlert, Alert
from core.models.tasks.base import FixedTask, Recurrence, Task, TaskAction, TaskReminder
from core.models.users.user_models import Family, User
from core.tests.utils.create_blocked_days import create_blocked_days
from core.utils.categories import Categories
from core.views.task_viewsets import TaskViewSet, bulk_create_tasks

logger = logging.getLogger(__name__)


ALERT_TEST_CASES = [
    (
        "Makes blocked day task alerts for self",
        {
            "req": {
                "start_datetime": "2023-01-01T08:00:00Z",
                "end_datetime": "2023-01-01T08:30:00Z",
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
        "Makes blocked day task alerts for self - previous year",
        {
            "req": {
                "start_datetime": "2023-01-01T08:00:00Z",
                "end_datetime": "2023-01-01T08:30:00Z",
            },
            "blocked_days": {
                "birthdays": {
                    "date": parser.parse("1992-01-01").date(),
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
        "Makes blocked day task alerts for other users",
        {
            "req": {
                "start_datetime": "2023-01-01T08:00:00Z",
                "end_datetime": "2023-01-01T08:30:00Z",
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
        "Makes blocked day task alerts for self for DUE_DATE tasks",
        {
            "req": {
                "date": "2023-01-01",
                "duration": "30",
                "resourcetype": "FixedTask",
                "type": "DUE_DATE",
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
            "date": "2023-01-01",
        },
    ),
    (
        "Makes blocked day task alerts for self for dated tasks",
        {
            "req": {
                "start_date": "2023-01-08",
                "end_date": "2023-01-10",
                "resourcetype": "FixedTask",
                "type": "TASK",
            },
            "blocked_days": {
                "birthdays": {
                    "date": parser.parse("2023-01-08").date(),
                    "category": Categories.TRANSPORT.value,
                },
            },
            "expected_alerts": ["BLOCKED_DAY"],
        },
        {
            "start_date": "2023-01-08",
            "end_date": "2023-01-10",
        },
    ),
    (
        "Makes blocked day task alerts for self for DUE_DATE task actions",
        {
            "req": {
                "date": "2023-01-08",
                "duration": "30",
                "resourcetype": "FixedTask",
                "type": "DUE_DATE",
                "actions": [{"action_timedelta": "7 00:00:00"}],
            },
            "blocked_days": {
                "birthdays": {
                    "date": parser.parse("2023-01-01").date(),
                    "category": Categories.TRANSPORT.value,
                },
            },
            "expected_action_alerts": ["BLOCKED_DAY"],
        },
        {
            "date": "2023-01-08",
        },
    ),
    (
        "Makes task conflict alerts for self",
        {
            "req": {
                "start_datetime": "2023-01-01T08:00:00Z",
                "end_datetime": "2023-01-01T08:30:00Z",
            },
            "fixed_tasks": [
                {
                    "task": {  # all day task should conflict with new task
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


class BaseTest(TestCase):
    """BaseTest"""

    def setUp(self):
        family = Family.objects.create()
        self.family = family
        other_family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test",
            phone_number="+447123456789",
            family=family,
            dob=parser.parse("1992-09-06").date(),
        )
        self.family_member = User.objects.create(
            username="family@test.test", phone_number="+447123456749", family=family
        )
        self.non_family_member = User.objects.create(
            username="non-family@test.test",
            phone_number="+447123456729",
            family=other_family,
        )
        self.untasked_user = User.objects.create(
            username="untasked@test.test", phone_number="+447123416789", family=family
        )
        self.friend = User.objects.create(
            username="friend@test.test",
            phone_number="+447123416444",
            family=other_family,
        )
        self.user.friends.add(self.friend)

        self.user_entity = Entity.objects.create(
            name="Test Entity",
            owner=self.user,
            category=Categories.TRANSPORT.value,
        )
        self.user_entity.members.add(self.user)
        self.user_entity.save()

        self.user_task = FixedTask.objects.create(
            title="Do something",
            start_datetime=dt.datetime.now(tzlocal()),
            end_datetime=dt.datetime.now(tzlocal()),
        )
        self.user_task.entities.add(self.user_entity)
        self.user_task.save()

        self.task_list_view = TaskViewSet.as_view({"get": "list"})
        self.task_patch_view = TaskViewSet.as_view({"patch": "partial_update"})
        self.task_create_view = TaskViewSet.as_view({"post": "create"})
        self.task_delete_view = TaskViewSet.as_view({"delete": "destroy"})


class TestTaskViewSet(BaseTest):
    """TestTaskViewSet"""

    def test_auth_required(self):
        """test_auth_required"""
        request = APIRequestFactory().get("/", {})
        res = self.task_list_view(request)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_can_get_response(self):
        """test_can_get_response"""
        request = APIRequestFactory().get("", {})
        force_authenticate(request, user=self.untasked_user)
        res = self.task_list_view(request)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def test_cannot_access_other_user_tasks(self):
        """test_cannot_access_other_user_tasks"""
        request = APIRequestFactory().get("")

        # Can access own tasks
        force_authenticate(request, user=self.user)
        res = self.task_list_view(request)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], self.user_task.id)

        # Family member can't access the same tasks
        force_authenticate(request, user=self.family_member)
        res = self.task_list_view(request)
        self.assertEqual(res.data, [])

    def test_can_access_task_if_member(self):
        """test_can_access_task_if_member"""
        self.user_task.members.add(self.family_member)
        request = APIRequestFactory().get("")

        # Owner gets expected response
        force_authenticate(request, user=self.user)
        res = self.task_list_view(request)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], self.user_task.id)

        # Member gets expected response
        force_authenticate(request, user=self.family_member)
        res = self.task_list_view(request)
        self.assertEqual([task["title"] for task in res.data], [self.user_task.title])

    def test_can_access_appointment_if_shared(self):
        """test_can_access_appointment_if_shared"""
        self.user_task.members.add(self.user)
        self.user_task.type = "APPOINTMENT"
        self.user_task.save()

        FamilyCategoryViewPermission.objects.create(
            user=self.user, category=Categories.TRANSPORT.value
        )

        request = APIRequestFactory().get("")

        # Owner gets expected response
        force_authenticate(request, user=self.user)
        res = self.task_list_view(request)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], self.user_task.id)

        # Member gets expected response
        force_authenticate(request, user=self.family_member)
        res = self.task_list_view(request)
        self.assertEqual([task["title"] for task in res.data], [self.user_task.title])

    def test_timezone_offsets(self):
        """test_timezone_offsets"""
        self.user_task.members.add(self.user)
        self.user_task.start_datetime = "2020-01-01T12:00:00Z"
        self.user_task.start_timezone = "Etc/GMT-4"
        self.user_task.end_datetime = "2020-01-01T18:00:00Z"
        self.user_task.end_timezone = "Etc/GMT+4"
        self.user_task.save()

        request = APIRequestFactory().get("")

        # Owner gets expected response
        force_authenticate(request, user=self.user)
        res = self.task_list_view(request)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], self.user_task.id)
        self.assertEqual(res.data[0]["start_datetime"], "2020-01-01T12:00:00Z")
        self.assertEqual(res.data[0]["end_datetime"], "2020-01-01T18:00:00Z")


class TestTaskViewSetCreate(BaseTest):
    """TestTaskViewSetCreate"""

    @parameterized.expand(
        [
            (
                "Fixed task with timezone",
                {
                    "title": "Test task",
                    "location": "",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "start_timezone": "Etc/GMT-2",  # Etc/GMT-2 is actually 2 hours ahead i.e. East
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "end_timezone": "Etc/GMT+5",  # Etc/GMT-5 is actually 5 hours behind i.e. West
                    "resourcetype": "FixedTask",
                    "members": [],
                },
                {
                    "recurrence": None,
                    "title": "Test task",
                    "location": "",
                    "start_datetime": "2022-01-01T08:00:00Z",
                    "end_datetime": "2022-01-01T16:00:00Z",
                    "start_timezone": "Etc/GMT-2",
                    "end_timezone": "Etc/GMT+5",
                    "members": [],
                    "resourcetype": "FixedTask",
                    "reminders": [],
                },
            ),
            (
                "Fixed task with empty members",
                {
                    "title": "Test task",
                    "location": "",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "members": [],
                },
                {
                    "recurrence": None,
                    "title": "Test task",
                    "location": "",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "members": [],
                    "resourcetype": "FixedTask",
                    "reminders": [],
                },
            ),
            (
                "Fixed task with members",
                {
                    "title": "Test task",
                    "location": "",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "members": ["user", "family_member"],
                },
                {
                    "recurrence": None,
                    "title": "Test task",
                    "location": "",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "reminders": [],
                },
            ),
            (
                "Fixed task with friend member",
                {
                    "title": "Test task",
                    "location": "",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "members": ["user", "family_member", "friend"],
                },
                {
                    "recurrence": None,
                    "title": "Test task",
                    "location": "",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "reminders": [],
                },
            ),
            (
                "Fixed task with contact detail fields",
                {
                    "title": "Test task",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "members": ["user", "family_member"],
                    "location": "test_location",
                    "contact_name": "test_contact_name",
                    "contact_email": "test_contact_email",
                    "contact_no": "+447123123123",
                    "notes": "test_notes",
                },
                {
                    "recurrence": None,
                    "title": "Test task",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "location": "test_location",
                    "contact_name": "test_contact_name",
                    "contact_email": "test_contact_email",
                    "contact_no": "+447123123123",
                    "notes": "test_notes",
                    "reminders": [],
                },
            ),
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
                        "earliest_occurrence": "2022-10-10T10:00:00",
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
                    "reminders": [],
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
                    "reminders": [],
                },
            ),
            (
                "Fixed task with reminder",
                {
                    "title": "Test task",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "members": ["user", "family_member"],
                    "reminders": [
                        {
                            "timedelta": "7 days, 0:00:00",
                        }
                    ],
                },
                {
                    "title": "Test task",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "reminders": [
                        {
                            "timedelta": "7 00:00:00",
                        }
                    ],
                    "recurrence": None,
                },
            ),
            (
                "Fixed task with actions",
                {
                    "title": "Test task",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "members": ["user", "family_member"],
                    "actions": [
                        {
                            "action_timedelta": "7 days, 0:00:00",
                        }
                    ],
                },
                {
                    "title": "Test task",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "actions": [
                        {
                            "action_timedelta": "7 00:00:00",
                        }
                    ],
                    "recurrence": None,
                },
            ),
            (
                "Fixed task with timezone and members and actions",
                {
                    "title": "Test task",
                    "location": "",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "start_timezone": "Etc/GMT-2",  # Etc/GMT-2 is actually 2 hours ahead i.e. East
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "end_timezone": "Etc/GMT+5",  # Etc/GMT-5 is actually 5 hours behind i.e. West
                    "resourcetype": "FixedTask",
                    "members": ["user", "family_member"],
                    "actions": [
                        {
                            "action_timedelta": "7 days, 0:00:00",
                        }
                    ],
                },
                {
                    "recurrence": None,
                    "title": "Test task",
                    "location": "",
                    "start_datetime": "2022-01-01T08:00:00Z",
                    "end_datetime": "2022-01-01T16:00:00Z",
                    "start_timezone": "Etc/GMT-2",
                    "end_timezone": "Etc/GMT+5",
                    "resourcetype": "FixedTask",
                    "reminders": [],
                    "actions": [
                        {
                            "action_timedelta": "7 00:00:00",
                        }
                    ],
                },
            ),
            (
                "Flight task with timezone and members and actions",
                {
                    "title": "Flight task",
                    "location": "",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "start_timezone": "Etc/GMT-2",  # Etc/GMT-2 is actually 2 hours ahead i.e. East
                    "start_location": "London",  # Etc/GMT-2 is actually 2 hours ahead i.e. East
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "end_timezone": "Etc/GMT+5",  # Etc/GMT-5 is actually 5 hours behind i.e. West
                    "end_location": "Paris",  # Etc/GMT-2 is actually 2 hours ahead i.e. East
                    "resourcetype": "TransportTask",
                    "type": "FLIGHT",
                    "members": ["user", "family_member"],
                    "actions": [
                        {
                            "action_timedelta": "7 days, 0:00:00",
                        }
                    ],
                },
                {
                    "recurrence": None,
                    "title": "FLIGHT London -> Paris",
                    "location": "",
                    "start_datetime": "2022-01-01T08:00:00Z",
                    "end_datetime": "2022-01-01T16:00:00Z",
                    "start_timezone": "Etc/GMT-2",
                    "start_location": "London",
                    "end_timezone": "Etc/GMT+5",
                    "end_location": "Paris",
                    "resourcetype": "TransportTask",
                    "type": "FLIGHT",
                    "reminders": [],
                    "actions": [
                        {
                            "action_timedelta": "7 00:00:00",
                        }
                    ],
                },
            ),
            (
                "Accommodation task with start_date and end_date",
                {
                    "title": "Hotel stay",
                    "location": "",
                    "start_date": "2022-01-01",
                    "accommodation_name": "The Ritz",  # Etc/GMT-2 is actually 2 hours ahead i.e. East
                    "end_date": "2022-01-10",
                    "resourcetype": "AccommodationTask",
                    "type": "HOTEL",
                    "members": ["user"],
                },
                {
                    "recurrence": None,
                    "title": "Stay - The Ritz",
                    "location": "",
                    "start_date": "2022-01-01",
                    "end_date": "2022-01-10",
                    "resourcetype": "AccommodationTask",
                    "type": "HOTEL",
                    "reminders": [],
                },
            ),
            (
                "Birthday task with known year",
                {
                    "date": "1992-09-06",
                    "known_year": True,
                    "duration": 30,
                    "first_name": "Birthday",
                    "last_name": "Boy",
                    "resourcetype": "BirthdayTask",
                    "type": "BIRTHDAY",
                    "members": ["user"],
                },
                {
                    "recurrence": None,
                    "title": "Birthday Boy's Birthday",
                    "date": "1992-09-06",
                    "resourcetype": "BirthdayTask",
                    "type": "BIRTHDAY",
                    "reminders": [],
                },
            ),
            (
                "Birthday task with known year only first name",
                {
                    "date": "1992-09-06",
                    "known_year": True,
                    "duration": 30,
                    "first_name": "Birthday",
                    "resourcetype": "BirthdayTask",
                    "type": "BIRTHDAY",
                    "members": ["user"],
                },
                {
                    "recurrence": None,
                    "title": "Birthday's Birthday",
                    "date": "1992-09-06",
                    "resourcetype": "BirthdayTask",
                    "type": "BIRTHDAY",
                    "reminders": [],
                },
            ),
            (
                "Test can create task and add random existing user",
                {
                    "title": "Test task",
                    "location": "",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "members": ["user"],
                    "external_members": ["+447111666555"],
                },
                {
                    "recurrence": None,
                    "title": "Test task",
                    "location": "",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T11:00:00Z",
                    "resourcetype": "FixedTask",
                    "reminders": [],
                },
            ),
        ]
    )
    def test_can_create_tasks(self, _, task, expected_response):
        """test_can_create_tasks"""

        if task.get("members"):
            task_members = task.pop("members")
            task["members"] = [
                getattr(self, member_name).id for member_name in task_members
            ]

        if task.get("external_members"):
            for phone_number in task.pop("external_members"):
                fam = Family.objects.create()
                user = User.objects.create(
                    username=phone_number, phone_number=phone_number, family=fam
                )
                task["members"].append(user.id)

        request = APIRequestFactory().post(
            "",
            {
                **task,
                "entities": [self.user_entity.id],
            },
            format="json",
        )

        force_authenticate(request, user=self.user)
        res = self.task_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        expected_recurrence = expected_response.pop("recurrence", None)
        if expected_recurrence:
            self.assertEqual(
                dict(res.data["recurrence"]),
                {
                    **expected_recurrence,
                    "task": res.data["id"],
                    "id": res.data["recurrence"]["id"],
                },
            )
        else:
            self.assertEqual(res.data["recurrence"], None)

        expected_reminders = expected_response.pop("reminders", None)
        if expected_reminders:
            self.assertEqual(len(expected_reminders), len(res.data["reminders"]))
            self.assertEqual(
                [dict(reminder) for reminder in res.data["reminders"]],
                [
                    {
                        **expected_reminder,
                        "task": res.data["id"],
                        "id": reminder["id"],
                    }
                    for (expected_reminder, reminder) in zip(
                        expected_reminders, res.data["reminders"]
                    )
                ],
            )
        else:
            self.assertEqual(res.data["reminders"], [])

        expected_actions = expected_response.pop("actions", None)
        if expected_actions:
            self.assertEqual(len(expected_actions), len(res.data["actions"]))
            self.assertEqual(
                [dict(action) for action in res.data["actions"]],
                [
                    {
                        **expected_action,
                        "task": res.data["id"],
                        "id": action["id"],
                    }
                    for (expected_action, action) in zip(
                        expected_actions, res.data["actions"]
                    )
                ],
            )
        else:
            self.assertEqual(res.data["actions"], [])

        for key in expected_response:
            self.assertEqual(res.data[key], expected_response[key])

        if not task.get("external_members"):
            self.assertEqual(set(res.data["members"]), set(task.get("members") or []))

        self.assertEqual(set(res.data["entities"]), {self.user_entity.id})

        new_id = res.data["id"]
        for phone_number in task.get("external_members", []):
            new_task = FixedTask.objects.get(id=new_id)
            task_members = list(new_task.members.all())
            self.assertIn(
                phone_number, [str(member.phone_number) for member in task_members]
            )

        if task.get("start_timezone"):
            task = FixedTask.objects.get(id=new_id)

            # TODO
            # self.assertEqual(...)

    def test_can_create_task_for_child_entity(self):
        """Test that a user can create a task for a child entity
        if a member of the parent entity"""
        child_entity = Entity.objects.create(
            owner=self.family_member,
            parent=self.user_entity,
            name="TEST CHILD ENTITY",
            category=1,
        )
        request = APIRequestFactory().post(
            "",
            {
                "title": "Test task",
                "start_datetime": "2022-01-01T10:00:00Z",
                "end_datetime": "2022-01-01T11:00:00Z",
                "resourcetype": "FixedTask",
                "members": [self.user.id],
                "entities": [child_entity.id],
            },
            format="json",
        )

        force_authenticate(request, user=self.user)
        res = self.task_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    @parameterized.expand(ALERT_TEST_CASES)
    def test_alerts_created(self, _, opts, expected):
        """Test that alerts are created when we create fixed tasks with conflicts"""

        user_blocked_days = opts.get("blocked_days")
        if user_blocked_days:
            create_blocked_days(user_blocked_days, self.user)

        premade_fixed_tasks = opts.get("fixed_tasks")
        if premade_fixed_tasks:
            for fixed_task in premade_fixed_tasks:
                task = FixedTask.objects.create(**fixed_task["task"])
                task.entities.add(self.user_entity)
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
                "resourcetype": "FixedTask",
                "members": members,
                "entities": [self.user_entity.id],
                **opts.get("req"),
            },
            format="json",
        )

        force_authenticate(req, self.user)

        res = self.task_create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        if expected.get("start_datetime"):
            self.assertEqual(res.data["start_datetime"], expected["start_datetime"])
        if expected.get("end_datetime"):
            self.assertEqual(res.data["end_datetime"], expected["end_datetime"])
        if expected.get("date"):
            self.assertEqual(res.data["date"], expected["date"])

        new_task = Task.objects.get(id=res.data["id"])

        user_expected_alerts = opts.get("expected_alerts")
        if user_expected_alerts:
            for alert_type in user_expected_alerts:
                # Just needs to successfully retrieve this
                Alert.objects.get(task=new_task, user=self.user, type=alert_type)

        user_expected_action_alerts = opts.get("expected_action_alerts")
        if user_expected_action_alerts:
            for alert_type in user_expected_action_alerts:
                # Just needs to successfully retrieve this
                ActionAlert.objects.get(
                    action__task=new_task, user=self.user, type=alert_type
                )

        if opts.get("other_users"):
            for other_user, other_user_conf in zip(
                other_users, opts.get("other_users")
            ):
                other_user_expected_alerts = other_user_conf.get("expected_alerts")
                if other_user_expected_alerts:
                    for alert_type in other_user_expected_alerts:
                        # Just needs to successfully retrieve this
                        Alert.objects.get(
                            task=new_task, user=other_user, type=alert_type
                        )

    def test_delete_task(self):
        """test_delete_task"""

        delete_req = APIRequestFactory().delete("")
        force_authenticate(delete_req, self.user)
        delete_res = self.task_delete_view(delete_req, pk=self.user_task.id)

        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Task.objects.filter(id=self.user_task.id).exists())


class TestBulkCreate(BaseTest):
    """Test can bulk create tasks"""

    def test_can_bulk_create_and_delete_tasks(self):
        """test_can_bulk_create_and_delete_tasks"""

        tasks_body = [
            {
                "title": "__TEST_TASK__",
                "resourcetype": "FixedTask",
                "members": [self.user.id],
                "entities": [self.user_entity.id],
                "start_datetime": "2020-01-01T10:00:00Z",
                "end_datetime": "2020-01-01T12:00:00Z",
            },
            {
                "title": "__ANOTHER_TEST_TASK__",
                "resourcetype": "FixedTask",
                "members": [self.user.id],
                "entities": [self.user_entity.id],
                "start_datetime": "2020-01-01T10:00:00Z",
                "end_datetime": "2020-01-01T12:00:00Z",
            },
        ]
        create_req = APIRequestFactory().post(
            "",
            tasks_body,
            format="json",
        )

        force_authenticate(create_req, self.user)

        create_res = bulk_create_tasks(create_req)
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)

        new_task_ids = [task["id"] for task in create_res.data]
        for task_body, task_id in zip(tasks_body, new_task_ids):
            task = Task.objects.get(id=task_id)
            self.assertEqual(
                task_body["members"], [m.id for m in list(task.members.all())]
            )
            self.assertEqual(
                task_body["entities"], [e.id for e in list(task.entities.all())]
            )

        # Couldn't work out how to do this using APIRequestFactory
        self.client.force_login(self.user)
        delete_res = self.client.delete(
            reverse("task-list"),
            data=json.dumps({"pk_ids": new_task_ids}),
            content_type="application/json",
        )
        self.assertEqual(delete_res.status_code, status.HTTP_204_NO_CONTENT)

        # Ensure that these entities don't exist
        for task_id in new_task_ids:
            self.assertFalse(Task.objects.filter(id=task_id).all())


class TestTaskViewSetUpdate(BaseTest):
    """TestTaskViewSetUpdate"""

    def test_can_update_task_with_family_members(self):
        """test_can_update_task_with_family_members"""
        # On patch we set the members to the provided list of members
        request = APIRequestFactory().patch(
            "", {"members": [self.user.id], "resourcetype": "FixedTask"}, format="json"
        )

        force_authenticate(request, user=self.user)
        res = self.task_patch_view(request, pk=self.user_task.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["members"], [self.user.id])

        # On update we set the members to exactly the new list of members
        change_request = APIRequestFactory().patch(
            "",
            {"members": [self.family_member.id], "resourcetype": "FixedTask"},
            format="json",
        )
        force_authenticate(change_request, user=self.user)

        res = self.task_patch_view(change_request, pk=self.user_task.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["members"], [self.family_member.id])

    def test_can_update_task_with_non_family_members(self):
        """test_can_update_task_with_non_family_members"""
        change_request = APIRequestFactory().patch(
            "",
            {"members": [self.non_family_member.id], "resourcetype": "FixedTask"},
            format="json",
        )
        force_authenticate(change_request, user=self.user)

        res = self.task_patch_view(change_request, pk=self.user_task.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(self.non_family_member.id in res.data["members"])

    def test_can_update_task_which_already_has_non_family_members(self):
        """test_can_update_task_which_already_has_non_family_members"""
        create_request = APIRequestFactory().post(
            "",
            {
                "title": "Test task",
                "start_datetime": "2022-01-01T10:00:00Z",
                "end_datetime": "2022-01-01T11:00:00Z",
                "resourcetype": "FixedTask",
                "members": [self.user.id, self.family_member.id, self.friend.id],
                "recurrence": None,
                "entities": [self.user_entity.id],
            },
            format="json",
        )

        force_authenticate(create_request, user=self.user)
        create_res = self.task_create_view(create_request)
        self.assertEqual(create_res.status_code, status.HTTP_201_CREATED)

        new_name = "UPDATED TASK NAME"
        change_request = APIRequestFactory().patch(
            "",
            {
                "title": new_name,
                "members": [self.user.id, self.family_member.id, self.friend.id],
            },
            format="json",
        )
        force_authenticate(change_request, user=self.friend)

        change_res = self.task_patch_view(change_request, pk=create_res.data["id"])

        self.assertEqual(change_res.status_code, status.HTTP_200_OK)
        self.assertEqual(change_res.data["title"], new_name)

    def test_can_make_task_recurrent(self):
        """test_can_make_task_recurrent"""
        change_request = APIRequestFactory().patch(
            "",
            {
                "recurrence": {
                    "recurrence": "WEEKLY",
                    "earliest_occurrence": "2022-10-10T10:00:00Z",
                    "latest_occurrence": None,
                    "interval_length": 1,
                },
            },
            format="json",
        )
        force_authenticate(change_request, user=self.user)

        res = self.task_patch_view(change_request, pk=self.user_task.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        # This just needs to not error
        Recurrence.objects.get(task=self.user_task)

    def test_can_update_task_with_reminders(self):
        """test_can_update_task_with_reminders"""
        change_request = APIRequestFactory().patch(
            "",
            {
                "reminders": [
                    {
                        "timedelta": "10 days, 00:00:00",
                    }
                ]
            },
            format="json",
        )
        force_authenticate(change_request, user=self.user)

        res = self.task_patch_view(change_request, pk=self.user_task.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.user_task.refresh_from_db()
        self.assertEqual(self.user_task.reminders.count(), 1)

        new_reminder = self.user_task.reminders.first()
        self.assertEqual(new_reminder.timedelta, dt.timedelta(days=10))

    def test_can_update_task_with_reminders_and_old_reminders_are_deleted(self):
        """test_can_update_task_with_reminders_and_old_reminders_are_deleted"""
        TaskReminder.objects.create(
            task=self.user_task,
            timedelta=dt.timedelta(days=30),
        )

        change_request = APIRequestFactory().patch(
            "",
            {
                "reminders": [
                    {
                        "timedelta": "10 days, 00:00:00",
                    }
                ]
            },
            format="json",
        )
        force_authenticate(change_request, user=self.user)

        res = self.task_patch_view(change_request, pk=self.user_task.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.user_task.refresh_from_db()
        self.assertEqual(self.user_task.reminders.count(), 1)

        new_reminder = self.user_task.reminders.first()
        self.assertEqual(new_reminder.timedelta, dt.timedelta(days=10))

    def test_can_update_task_with_actions(self):
        """test_can_update_task_with_actions"""
        change_request = APIRequestFactory().patch(
            "",
            {
                "actions": [
                    {
                        "action_timedelta": "10 days, 00:00:00",
                    }
                ]
            },
            format="json",
        )
        force_authenticate(change_request, user=self.user)

        res = self.task_patch_view(change_request, pk=self.user_task.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.user_task.refresh_from_db()
        self.assertEqual(self.user_task.actions.count(), 1)

        new_action = self.user_task.actions.first()
        self.assertEqual(new_action.action_timedelta, dt.timedelta(days=10))

    def test_can_update_task_with_actions_and_old_actions_are_deleted(self):
        """test_can_update_task_with_actions_and_old_actions_are_deleted"""
        TaskAction.objects.create(
            task=self.user_task,
            action_timedelta=dt.timedelta(days=30),
        )

        change_request = APIRequestFactory().patch(
            "",
            {
                "actions": [
                    {
                        "action_timedelta": "10 days, 00:00:00",
                    }
                ]
            },
            format="json",
        )
        force_authenticate(change_request, user=self.user)

        res = self.task_patch_view(change_request, pk=self.user_task.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.user_task.refresh_from_db()
        self.assertEqual(self.user_task.actions.count(), 1)

        new_action = self.user_task.actions.first()
        self.assertEqual(new_action.action_timedelta, dt.timedelta(days=10))

    def test_can_update_task_with_actions_and_preserve_appropriately(self):
        """test_can_update_task_with_actions_and_preserve_appropriately"""
        existing_action = TaskAction.objects.create(
            task=self.user_task,
            action_timedelta=dt.timedelta(days=10),
        )

        change_request = APIRequestFactory().patch(
            "",
            {
                "actions": [
                    {
                        "action_timedelta": "10 days, 00:00:00",
                    }
                ]
            },
            format="json",
        )
        force_authenticate(change_request, user=self.user)

        res = self.task_patch_view(change_request, pk=self.user_task.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.user_task.refresh_from_db()
        self.assertEqual(self.user_task.actions.count(), 1)

        # Should not delete the existing action
        new_action = self.user_task.actions.first()
        self.assertEqual(new_action.action_timedelta, dt.timedelta(days=10))
        self.assertEqual(new_action.id, existing_action.id)

    @parameterized.expand(ALERT_TEST_CASES)
    def test_alerts_created(self, _, opts, expected):
        """Test that alerts are created when we update fixed tasks with conflicts"""

        user_blocked_days = opts.get("blocked_days")
        if user_blocked_days:
            create_blocked_days(user_blocked_days, self.user)

        premade_fixed_tasks = opts.get("fixed_tasks")
        if premade_fixed_tasks:
            for fixed_task in premade_fixed_tasks:
                task = FixedTask.objects.create(**fixed_task["task"])
                task.entities.add(self.user_entity)
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

        task_to_update = (
            FixedTask.objects.create(
                date="2000-01-01",
                duration=30,
                title="__TASK_TO_UPDATE__",
                type="DUE_DATE",
            )
            if opts.get("req") and opts.get("req").get("type") == "DUE_DATE"
            else FixedTask.objects.create(
                start_datetime="2000-01-01T10:00:00Z",
                end_datetime="2000-01-01T11:00:00Z",
                title="__TASK_TO_UPDATE__",
            )
        )

        task_to_update.members.set(self.family.users.all())
        task_to_update.entities.set([self.user_entity])

        req = APIRequestFactory().patch("", opts.get("req"), format="json")

        force_authenticate(req, self.user)

        res = self.task_patch_view(req, pk=task_to_update.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        if expected.get("start_datetime"):
            self.assertEqual(res.data["start_datetime"], expected["start_datetime"])
        if expected.get("end_datetime"):
            self.assertEqual(res.data["end_datetime"], expected["end_datetime"])
        if expected.get("date"):
            self.assertEqual(res.data["date"], expected["date"])

        new_task = Task.objects.get(id=res.data["id"])

        user_expected_alerts = opts.get("expected_alerts")
        if user_expected_alerts:
            for alert_type in user_expected_alerts:
                # Just needs to successfully retrieve this
                Alert.objects.get(task=new_task, user=self.user, type=alert_type)

        user_expected_action_alerts = opts.get("expected_action_alerts")
        if user_expected_action_alerts:
            for alert_type in user_expected_action_alerts:
                # Just needs to successfully retrieve this
                ActionAlert.objects.get(
                    action__task=new_task, user=self.user, type=alert_type
                )

        if opts.get("other_users"):
            for other_user, other_user_conf in zip(
                other_users, opts.get("other_users")
            ):
                other_user_expected_alerts = other_user_conf.get("expected_alerts")
                if other_user_expected_alerts:
                    for alert_type in other_user_expected_alerts:
                        # Just needs to successfully retrieve this
                        Alert.objects.get(
                            task=new_task, user=other_user, type=alert_type
                        )

    def test_does_not_create_alert_for_generic_update(self):
        """Should not create an alert for some random change - even if conflicting"""
        premade_task = FixedTask.objects.create(
            start_datetime="2020-01-01T10:00:00Z",
            end_datetime="2020-01-01T11:00:00Z",
            title="__PREMADE_TASK__",
        )

        premade_task.members.set(self.family.users.all())
        premade_task.entities.set([self.user_entity])
        premade_task.save()

        task_to_update = FixedTask.objects.create(
            start_datetime="2020-01-01T10:00:00Z",
            end_datetime="2020-01-01T11:00:00Z",
            title="__TASK_TO_UPDATE__",
        )

        task_to_update.members.set(self.family.users.all())
        task_to_update.entities.set([self.user_entity])
        task_to_update.save()

        req = APIRequestFactory().patch("", {"title": "__NEW_TITLE__"}, format="json")
        force_authenticate(req, self.user)

        res = self.task_patch_view(req, pk=task_to_update.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(Alert.objects.all().count(), 0)

    def test_does_not_create_alert_for_time_updates_if_no_other_tasks(self):
        """Should not create an alert for conflict with old self"""
        task_to_update = FixedTask.objects.create(
            start_datetime="2020-01-01T10:00:00Z",
            end_datetime="2020-01-01T11:00:00Z",
            title="__TASK_TO_UPDATE__",
        )

        task_to_update.members.set(self.family.users.all())
        task_to_update.entities.set([self.user_entity])
        task_to_update.save()

        req = APIRequestFactory().patch(
            "",
            {
                "start_datetime": "2020-01-01T10:15:00Z",
                "end_datetime": "2020-01-01T11:15:00Z",
            },
            format="json",
        )
        force_authenticate(req, self.user)

        res = self.task_patch_view(req, pk=task_to_update.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(Alert.objects.all().count(), 0)

    def test_deletes_old_alert_on_update(self):
        """Should delete old alerts"""
        task_to_update = FixedTask.objects.create(
            start_datetime="2020-01-01T10:00:00Z",
            end_datetime="2020-01-01T11:00:00Z",
            title="__TASK_TO_UPDATE__",
        )
        existing_alert = Alert.objects.create(
            type="BLOCKED_DAY", task=task_to_update, user=self.user
        )

        task_to_update.members.set(self.family.users.all())
        task_to_update.entities.set([self.user_entity])
        task_to_update.save()

        req = APIRequestFactory().patch(
            "",
            {
                "start_datetime": "2020-01-01T10:15:00Z",
                "end_datetime": "2020-01-01T11:15:00Z",
            },
            format="json",
        )
        force_authenticate(req, self.user)

        res = self.task_patch_view(req, pk=task_to_update.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(Alert.objects.all().count(), 0)

    def test_deletes_old_action_alert_on_update(self):
        """Should delete old action alerts"""
        task_to_update = FixedTask.objects.create(
            start_datetime="2020-01-01T10:00:00Z",
            end_datetime="2020-01-01T11:00:00Z",
            title="__TASK_TO_UPDATE__",
        )
        existing_action = TaskAction.objects.create(
            task=task_to_update, action_timedelta=dt.timedelta(days=7)
        )
        existing_action_alert = ActionAlert.objects.create(
            action=existing_action, user=self.user, type="BLOCKED_DAY"
        )
        task_to_update.members.set(self.family.users.all())
        task_to_update.entities.set([self.user_entity])
        task_to_update.save()

        req = APIRequestFactory().patch(
            "",
            {
                "start_datetime": "2020-01-01T10:15:00Z",
                "end_datetime": "2020-01-01T11:15:00Z",
            },
            format="json",
        )
        force_authenticate(req, self.user)

        res = self.task_patch_view(req, pk=task_to_update.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(ActionAlert.objects.all().count(), 0)

    def test_can_update_entities_without_being_member(self):
        """Test that a user can set an entity on a task to
        be one that is already on the task even if not a member
        of the entity"""

        task_to_update = FixedTask.objects.create(
            start_datetime="2020-01-01T10:00:00Z",
            end_datetime="2020-01-01T11:00:00Z",
            title="__TASK_TO_UPDATE__",
        )

        existing_entity = Entity.objects.create(
            name="Entity",
            owner=self.family_member,
            category=Categories.TRANSPORT.value,
        )
        existing_entity.members.add(self.family_member)

        task_to_update.entities.add(existing_entity)
        task_to_update.members.add(self.user)

        req = APIRequestFactory().patch(
            "",
            {"entities": [ent.id for ent in list(task_to_update.entities.all())]},
            format="json",
        )
        force_authenticate(req, self.user)

        res = self.task_patch_view(req, pk=task_to_update.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
