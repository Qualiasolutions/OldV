"""Tests for the scheduling viewset"""

import datetime as dt
import logging
from typing import Any

import pytz
from dateutil import parser
from dateutil.tz import tzlocal
from django.test import TestCase
from django.urls import reverse
from parameterized import parameterized  # type: ignore
from rest_framework import status

from core.models.entities.base import Entity
from core.models.entities.pets import Pet
from core.models.entities.social import Event
from core.models.routines.routines import Routine
from core.models.settings.family_visibility import FamilyCategoryViewPermission
from core.models.settings.preferred_days import PreferredDays
from core.models.tasks.anniversaries import UserBirthdayTask
from core.models.tasks.base import (
    FixedTask,
    FlexibleTask,
    Recurrence,
    RecurrentTaskOverwrite,
    TaskAction,
)
from core.models.tasks.task_limits import TaskLimit
from core.models.users.user_models import Family, User
from core.tests.utils.create_blocked_days import create_blocked_days
from core.utils.categories import Categories

utc = pytz.UTC


logger = logging.getLogger(__name__)


def create_task_limits(task_limits_conf: list[Any], user: User):
    """Create task limits for the user provided"""
    for task_limits in task_limits_conf:
        TaskLimit.objects.create(user=user, **task_limits)


def create_view_permissions(categories: list[int], user: User):
    """Create categoriy appointment share permissions"""
    for cat in categories:
        FamilyCategoryViewPermission.objects.create(category=cat, user=user)


def create_preferred_days(preferred_days_conf: list[Any], user: User):
    """Create preferred days entities for the user provided"""
    for preferred_days in preferred_days_conf:
        day_opts = {day: True for day in preferred_days["days"]}
        PreferredDays.objects.create(
            user=user, category=preferred_days["category"], **day_opts
        )


class TestScheduledTaskViewSet(TestCase):
    """TestScheduledTaskViewSet"""

    url = reverse("scheduled_task-list")

    def test_auth_required(self):
        """test_auth_required"""
        res = self.client.get(
            self.url,
            {
                "earliest_datetime": "2020-01-01T00:00:00T",
                "latest_datetime": "2020-01-01T00:00:00T",
            },
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_can_get_response(self):
        """test_can_get_response"""
        user = User.objects.create(
            username="test@test.test", phone_number="+447814187441"
        )
        self.client.force_login(user)
        res = self.client.get(
            self.url,
            {
                "earliest_datetime": "2020-01-01T00:00:00T",
                "latest_datetime": "2020-01-01T00:00:00T",
            },
        )

        self.assertEqual(res.json()["tasks"], [])

    def test_cannot_access_other_user_tasks(self):
        """test_cannot_access_other_user_tasks"""
        family = Family.objects.create()
        user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=family
        )
        other_user = User.objects.create(
            username="other@test.test", phone_number="+447123456780", family=family
        )

        user_entity = Entity.objects.create(
            name="Test Entity",
            owner=user,
            category=Categories.TRANSPORT.value,
        )
        user_entity.members.add(user)
        user_entity.save()

        user_task = FixedTask.objects.create(
            title="Do something",
            start_datetime=dt.datetime.now(tzlocal()),
            end_datetime=dt.datetime.now(tzlocal()),
        )
        user_task.entities.add(user_entity)
        user_task.save()

        self.client.force_login(user)
        res = self.client.get(
            self.url,
            {
                "earliest_datetime": "2020-01-01T00:00:00T",
                "latest_datetime": "2030-01-01T00:00:00T",
            },
        )
        res_data = res.json()["tasks"]
        self.assertEqual(len(res_data), 1)
        self.assertEqual(res_data[0]["id"], user_task.id)

        self.client.force_login(other_user)
        res = self.client.get(
            self.url,
            {
                "earliest_datetime": "2020-01-01T00:00:00T",
                "latest_datetime": "2030-01-01T00:00:00T",
            },
        )
        res_data = res.json()["tasks"]
        self.assertEqual(res_data, [])

    def test_can_access_other_user_tasks_on_member_entity(self):
        """test_can_access_other_user_tasks_on_member_entity"""
        family = Family.objects.create()
        user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=family
        )
        other_user = User.objects.create(
            username="other@test.test", phone_number="+447123456780", family=family
        )

        user_entity = Entity.objects.create(
            name="Test Entity", owner=user, category=Categories.TRANSPORT.value
        )
        user_entity.members.set([user, other_user])

        user_task = FixedTask.objects.create(
            title="Do something",
            start_datetime=dt.datetime.now(tzlocal()),
            end_datetime=dt.datetime.now(tzlocal()),
        )
        user_task.entities.add(user_entity)
        user_task.save()

        for u in [user, other_user]:
            self.client.force_login(u)
            res = self.client.get(
                self.url,
                {
                    "earliest_datetime": "2020-01-01T00:00:00T",
                    "latest_datetime": "2030-01-01T00:00:00T",
                },
            )

            res_data = res.json()["tasks"]
            self.assertEqual(len(res_data), 1)
            self.assertEqual(res_data[0]["id"], user_task.id)

    def test_can_access_task_if_member(self):
        """test_can_access_task_if_member"""
        family = Family.objects.create()
        user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=family
        )
        other_user = User.objects.create(
            username="other@test.test", phone_number="+447123456780", family=family
        )

        user_entity = Entity.objects.create(
            name="Test Entity",
            owner=user,
            category=Categories.TRANSPORT.value,
        )
        user_entity.members.add(user)

        task_title = "Do something"
        user_task = FixedTask.objects.create(
            title=task_title,
            start_datetime=dt.datetime.now(tzlocal()),
            end_datetime=dt.datetime.now(tzlocal()),
        )
        user_task.entities.add(user_entity)
        user_task.save()

        user_task.members.add(other_user)

        self.client.force_login(user)
        res = self.client.get(
            self.url,
            {
                "earliest_datetime": "2020-01-01T00:00:00T",
                "latest_datetime": "2030-01-01T00:00:00T",
            },
        )

        res_data = res.json()["tasks"]
        self.assertEqual(len(res_data), 1)
        self.assertEqual(res_data[0]["id"], user_task.id)

        self.client.force_login(other_user)
        res = self.client.get(
            self.url,
            {
                "earliest_datetime": "2020-01-01T00:00:00T",
                "latest_datetime": "2030-01-01T00:00:00T",
            },
        )
        res_data = res.json()["tasks"]
        self.assertEqual([task["title"] for task in res_data], [task_title])

    @parameterized.expand(
        [
            (
                "Returns all Fixed Tasks if they are within the filters",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-01T12:00:00Z"),
                                "end_datetime": parser.parse("2022-01-01T13:00:00Z"),
                            }
                        },
                        {
                            "task": {
                                "title": "Task2",
                                "start_datetime": parser.parse("2022-02-01T12:00:00Z"),
                                "end_datetime": parser.parse("2022-02-01T13:00:00Z"),
                            }
                        },
                    ],
                    "flexible_tasks": [],
                },
                "20211225T00:00:00Z",
                "20220205T00:00:00Z",
                ["Task1", "Task2"],
            ),
            (
                "Returns all DUE_DATE objects if they are within the filters",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "date": parser.parse("2022-01-01"),
                                "duration": 30,
                                "type": "DUE_DATE",
                            }
                        }
                    ],
                    "flexible_tasks": [],
                },
                "20211225T00:00:00Z",
                "20220205T00:00:00Z",
                ["Task1"],
            ),
            (
                "Returns both FixedTask and DUE_DATE objects if they are within the filters",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "FixedTask",
                                "start_datetime": parser.parse("2022-01-01T12:00:00Z"),
                                "end_datetime": parser.parse("2022-01-01T13:00:00Z"),
                            }
                        },
                        {
                            "task": {
                                "title": "DueDate",
                                "date": parser.parse("2022-01-01"),
                                "duration": 30,
                                "type": "DUE_DATE",
                            }
                        },
                    ],
                    "flexible_tasks": [],
                },
                "20211225T00:00:00Z",
                "20220205T00:00:00Z",
                ["DueDate", "FixedTask"],
            ),
            (
                "Filters out Fixed Tasks if they are before earliest time",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-01T12:00:00Z"),
                                "end_datetime": parser.parse("2022-01-01T13:00:00Z"),
                            }
                        },
                        {
                            "task": {
                                "title": "Task2",
                                "start_datetime": parser.parse("2022-02-01T12:00:00Z"),
                                "end_datetime": parser.parse("2022-02-01T13:00:00Z"),
                            }
                        },
                    ],
                    "flexible_tasks": [],
                },
                "20220102T00:00:00Z",
                "20220205T00:00:00Z",
                ["Task2"],
            ),
            (
                "Filters out Fixed Tasks if they are after latest time",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-01T12:00:00Z"),
                                "end_datetime": parser.parse("2022-01-01T13:00:00Z"),
                            }
                        },
                        {
                            "task": {
                                "title": "Task2",
                                "start_datetime": parser.parse("2022-02-01T12:00:00Z"),
                                "end_datetime": parser.parse("2022-02-01T13:00:00Z"),
                            }
                        },
                    ],
                    "flexible_tasks": [],
                },
                "20211202T00:00:00Z",
                "20220105T00:00:00Z",
                ["Task1"],
            ),
            (
                "Filters out Flexible Tasks if they are before earliest time",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-01"
                                ).date(),
                                "due_date": parser.parse("2022-01-25").date(),
                                "duration": 30,
                            }
                        },
                        {
                            "task": {
                                "title": "Task2",
                                "earliest_action_date": parser.parse(
                                    "2022-03-01"
                                ).date(),
                                "due_date": parser.parse("2022-03-25").date(),
                                "duration": 30,
                            }
                        },
                    ],
                },
                "20220201T00:00:00Z",
                "20220401T00:00:00Z",
                ["Task2"],
            ),
            (
                "Filters out Flexible Tasks if they are after latest time",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-01"
                                ).date(),
                                "due_date": parser.parse("2022-01-25").date(),
                                "duration": 30,
                            }
                        },
                        {
                            "task": {
                                "title": "Task2",
                                "earliest_action_date": parser.parse(
                                    "2022-03-01"
                                ).date(),
                                "due_date": parser.parse("2022-03-25").date(),
                                "duration": 30,
                            }
                        },
                    ],
                },
                "20220101T00:00:00Z",
                "20220201T00:00:00Z",
                ["Task1"],
            ),
            (
                "Places Flexible Tasks on day currently with least tasks",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-01T12:00:00Z"),
                                "end_datetime": parser.parse("2022-01-01T13:00:00Z"),
                            }
                        },
                        {
                            "task": {
                                "title": "Task2",
                                "start_datetime": parser.parse("2022-01-02T12:00:00Z"),
                                "end_datetime": parser.parse("2022-01-02T13:00:00Z"),
                            }
                        },
                        {
                            "task": {
                                "title": "Task3",
                                "start_datetime": parser.parse("2022-01-04T12:00:00Z"),
                                "end_datetime": parser.parse("2022-01-04T13:00:00Z"),
                            }
                        },
                    ],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task4",
                                "earliest_action_date": parser.parse(
                                    "2022-01-01"
                                ).date(),
                                "due_date": parser.parse("2022-01-25").date(),
                                "duration": 30,
                            }
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220201T00:00:00Z",
                ["Task1", "Task2", "Task4", "Task3"],
                [
                    "2022-01-01T12:00:00Z",
                    "2022-01-02T12:00:00Z",
                    "2022-01-03T08:00:00Z",
                    "2022-01-04T12:00:00Z",
                ],
            ),
            (
                """Fixed Task with infinite weekly recurrence should be returned with separate 
                occurrences if timeframe is provided""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-01T12:00:00Z"),
                                "end_datetime": parser.parse("2022-01-01T13:00:00Z"),
                            },
                            "recurrence": {"recurrence": "WEEKLY"},
                        }
                    ],
                    "flexible_tasks": [],
                },
                "20220101T00:00:00Z",
                "20220201T00:00:00Z",
                # Jan 1st, 8th, 15th, 22nd, 29th
                ["Task1", "Task1", "Task1", "Task1", "Task1"],
                [
                    "2022-01-01T12:00:00Z",
                    "2022-01-08T12:00:00Z",
                    "2022-01-15T12:00:00Z",
                    "2022-01-22T12:00:00Z",
                    "2022-01-29T12:00:00Z",
                ],
            ),
            (
                """Fixed Task with infinite bi-weekly recurrence should be returned with separate 
                occurrences if timeframe is provided""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-01T12:00:00Z"),
                                "end_datetime": parser.parse("2022-01-01T13:00:00Z"),
                            },
                            "recurrence": {
                                "recurrence": "WEEKLY",
                                "interval_length": 2,
                            },
                        }
                    ],
                    "flexible_tasks": [],
                },
                "20220101T00:00:00Z",
                "20220201T00:00:00Z",
                # Jan 1st, 15th, 29th
                ["Task1", "Task1", "Task1"],
                [
                    "2022-01-01T12:00:00Z",
                    "2022-01-15T12:00:00Z",
                    "2022-01-29T12:00:00Z",
                ],
            ),
            (
                """Fixed Task with infinite bi-weekdaily recurrence should be returned with separate 
                occurrences if timeframe is provided""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-03T12:00:00Z"),
                                "end_datetime": parser.parse("2022-01-03T13:00:00Z"),
                            },
                            "recurrence": {
                                "recurrence": "WEEKDAILY",
                                "interval_length": 2,
                            },
                        }
                    ],
                    "flexible_tasks": [],
                },
                "20220101T00:00:00Z",
                "20220201T00:00:00Z",
                ["Task1"] * 11,
                [
                    "2022-01-03T12:00:00Z",
                    "2022-01-05T12:00:00Z",
                    "2022-01-07T12:00:00Z",
                    "2022-01-11T12:00:00Z",
                    "2022-01-13T12:00:00Z",
                    "2022-01-17T12:00:00Z",
                    "2022-01-19T12:00:00Z",
                    "2022-01-21T12:00:00Z",
                    "2022-01-25T12:00:00Z",
                    "2022-01-27T12:00:00Z",
                    "2022-01-31T12:00:00Z",
                ],
            ),
            (
                """Fixed Task with infinite month-weekly recurrence should be returned with separate 
                occurrences if timeframe is provided - first week""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-01T08:00:00Z"),
                                "end_datetime": parser.parse("2022-01-01T09:00:00Z"),
                            },
                            "recurrence": {"recurrence": "MONTH_WEEKLY"},
                        }
                    ],
                    "flexible_tasks": [],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                # Jan 1st, Feb 5th, March 5th, April 2nd, May 7th
                ["Task1", "Task1", "Task1", "Task1", "Task1"],
                [
                    "2022-01-01T08:00:00Z",
                    "2022-02-05T08:00:00Z",
                    "2022-03-05T08:00:00Z",
                    "2022-04-02T08:00:00Z",
                    "2022-05-07T08:00:00Z",
                ],
            ),
            (
                """Fixed Task with infinite month-weekly recurrence should be returned with separate 
                occurrences if timeframe is provided - fourth week""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-27T08:00:00Z"),
                                "end_datetime": parser.parse("2022-01-27T09:00:00Z"),
                            },
                            "recurrence": {"recurrence": "MONTH_WEEKLY"},
                        }
                    ],
                    "flexible_tasks": [],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1", "Task1", "Task1", "Task1", "Task1"],
                # Jan 27th, Feb 24th, March 24th, April 28th, May 26th
                [
                    "2022-01-27T08:00:00Z",
                    "2022-02-24T08:00:00Z",
                    "2022-03-24T08:00:00Z",
                    "2022-04-28T08:00:00Z",
                    "2022-05-26T08:00:00Z",
                ],
            ),
            (
                """Fixed Task with infinite monthly-last-week recurrence should be returned with separate 
                occurrences if timeframe is provided - last week""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-27T08:00:00Z"),
                                "end_datetime": parser.parse("2022-01-27T09:00:00Z"),
                            },
                            "recurrence": {"recurrence": "MONTHLY_LAST_WEEK"},
                        }
                    ],
                    "flexible_tasks": [],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1", "Task1", "Task1", "Task1", "Task1"],
                # Jan 27th, Feb 24th, March 31st, April 28th, May 26th
                [
                    "2022-01-27T08:00:00Z",
                    "2022-02-24T08:00:00Z",
                    "2022-03-31T08:00:00Z",
                    "2022-04-28T08:00:00Z",
                    "2022-05-26T08:00:00Z",
                ],
            ),
            (
                """Fixed Task with infinite bi-monthly month-weekly recurrence should be returned with 
                separate occurrences if timeframe is provided - fourth week""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-27T08:00:00Z"),
                                "end_datetime": parser.parse("2022-01-27T09:00:00Z"),
                            },
                            "recurrence": {
                                "recurrence": "MONTH_WEEKLY",
                                "interval_length": 2,
                            },
                        }
                    ],
                    "flexible_tasks": [],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1", "Task1", "Task1"],
                # Jan 27th, Feb 24th, March 24th, April 28th, May 26th
                [
                    "2022-01-27T08:00:00Z",
                    "2022-03-24T08:00:00Z",
                    "2022-05-26T08:00:00Z",
                ],
            ),
            (
                """Fixed Task with infinite year-month-weekly recurrence should be returned with separate 
                occurrences if timeframe is provided - fourth Friday of January""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-28T08:00:00Z"),
                                "end_datetime": parser.parse("2022-01-28T09:00:00Z"),
                            },
                            "recurrence": {"recurrence": "YEAR_MONTH_WEEKLY"},
                        }
                    ],
                    "flexible_tasks": [],
                },
                "20220101T00:00:00Z",
                "20240601T00:00:00Z",
                ["Task1", "Task1", "Task1"],
                # Jan 28th 2022, Jan 27th 2023, Jan 26th 2024
                [
                    "2022-01-28T08:00:00Z",
                    "2023-01-27T08:00:00Z",
                    "2024-01-26T08:00:00Z",
                ],
            ),
            (
                """Fixed Task with infinite bi-yearly year-month-weekly recurrence should be returned with separate
                occurrences if timeframe is provided - fourth Friday of January""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-28T08:00:00Z"),
                                "end_datetime": parser.parse("2022-01-28T09:00:00Z"),
                            },
                            "recurrence": {
                                "recurrence": "YEAR_MONTH_WEEKLY",
                                "interval_length": 2,
                            },
                        }
                    ],
                    "flexible_tasks": [],
                },
                "20220101T00:00:00Z",
                "20240601T00:00:00Z",
                ["Task1", "Task1"],
                # Jan 28th 2022, Jan 27th 2023, Jan 26th 2024
                [
                    "2022-01-28T08:00:00Z",
                    "2024-01-26T08:00:00Z",
                ],
            ),
            (
                """Flexible Task with infinite weekly recurrence should be returned with separate 
                occurrences if timeframe is provided""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-01"
                                ).date(),
                                "due_date": parser.parse("2022-01-04").date(),
                                "duration": 30,
                            },
                            "recurrence": {"recurrence": "WEEKLY"},
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220201T00:00:00Z",
                # Jan 1st, 8th, 15th, 22nd, 29th
                ["Task1", "Task1", "Task1", "Task1", "Task1"],
                [
                    "2022-01-01T08:00:00Z",
                    "2022-01-08T08:00:00Z",
                    "2022-01-15T08:00:00Z",
                    "2022-01-22T08:00:00Z",
                    "2022-01-29T08:00:00Z",
                ],
            ),
            (
                """Flexible Task with infinite month-weekly recurrence should be returned with separate 
                occurrences if timeframe is provided - first week""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-01"
                                ).date(),
                                "due_date": parser.parse("2022-01-04").date(),
                                "duration": 30,
                            },
                            "recurrence": {"recurrence": "MONTH_WEEKLY"},
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                # Jan 1st, Feb 5th, March 5th, April 2nd, May 7th
                ["Task1", "Task1", "Task1", "Task1", "Task1"],
                [
                    "2022-01-01T08:00:00Z",
                    "2022-02-05T08:00:00Z",
                    "2022-03-05T08:00:00Z",
                    "2022-04-02T08:00:00Z",
                    "2022-05-07T08:00:00Z",
                ],
            ),
            (
                """Flexible Task with infinite month-weekly recurrence should be returned with separate 
                occurrences if timeframe is provided - fourth week""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-01-29").date(),
                                "duration": 30,
                            },
                            "recurrence": {"recurrence": "MONTH_WEEKLY"},
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1", "Task1", "Task1", "Task1", "Task1"],
                # Jan 27th, Feb 24th, March 24th, April 28th, May 26th
                [
                    "2022-01-27T08:00:00Z",
                    "2022-02-24T08:00:00Z",
                    "2022-03-24T08:00:00Z",
                    "2022-04-28T08:00:00Z",
                    "2022-05-26T08:00:00Z",
                ],
            ),
            (
                """Flexible Task should not be returned if placed outside timerange""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-01"
                                ).date(),
                                "due_date": parser.parse("2022-01-04").date(),
                                "duration": 30,
                            }
                        }
                    ],
                },
                "20220102T00:00:00Z",
                "20220202T00:00:00Z",
                [],
                [],
            ),
            (
                """Flexible Task with infinite weekly recurrence should be returned with separate 
                occurrences if timeframe is provided - override should be respected""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-01"
                                ).date(),
                                "due_date": parser.parse("2022-01-04").date(),
                                "duration": 30,
                            },
                            "recurrence": {"recurrence": "WEEKLY"},
                            "overrides": [
                                {
                                    "recurrence_index": 1,
                                    "task": {
                                        "title": "A different task title",
                                        "earliest_action_date": parser.parse(
                                            "2022-01-09"
                                        ).date(),
                                        "due_date": parser.parse("2022-01-10").date(),
                                        "duration": 60,
                                    },
                                }
                            ],
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220201T00:00:00Z",
                # The second occurrence has been bumped to the 9th
                ["Task1", "A different task title", "Task1", "Task1", "Task1"],
                [
                    "2022-01-01T08:00:00Z",
                    "2022-01-09T08:00:00Z",
                    "2022-01-15T08:00:00Z",
                    "2022-01-22T08:00:00Z",
                    "2022-01-29T08:00:00Z",
                ],
            ),
            (
                """Fixed Task with infinite weekly recurrence should be returned with separate 
                occurrences if timeframe is provided - override should be respected""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-01T12:00:00Z"),
                                "end_datetime": parser.parse("2022-01-01T13:00:00Z"),
                            },
                            "recurrence": {"recurrence": "WEEKLY"},
                            "overrides": [
                                {
                                    "recurrence_index": 1,
                                    "task": {
                                        "title": "A different task title",
                                        "start_datetime": parser.parse(
                                            "2022-01-10T09:00:00Z"
                                        ),
                                        "end_datetime": parser.parse(
                                            "2022-01-10T10:00:00Z"
                                        ),
                                    },
                                }
                            ],
                        }
                    ],
                    "flexible_tasks": [],
                },
                "20220101T00:00:00Z",
                "20220201T00:00:00Z",
                # The second occurrence has been bumped to the 10th
                ["Task1", "A different task title", "Task1", "Task1", "Task1"],
                [
                    "2022-01-01T12:00:00Z",
                    "2022-01-10T09:00:00Z",
                    "2022-01-15T12:00:00Z",
                    "2022-01-22T12:00:00Z",
                    "2022-01-29T12:00:00Z",
                ],
            ),
            (
                """Fixed Task with infinite weekly recurrence should be returned with separate 
                occurrences if timeframe is provided - DELETE override should be respected""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-01T12:00:00Z"),
                                "end_datetime": parser.parse("2022-01-01T13:00:00Z"),
                            },
                            "recurrence": {"recurrence": "WEEKLY"},
                            "overrides": [
                                {
                                    "recurrence_index": 1,
                                    "task": None,
                                }
                            ],
                        }
                    ],
                    "flexible_tasks": [],
                },
                "20220101T00:00:00Z",
                "20220201T00:00:00Z",
                # The second occurrence has been bumped to the 10th
                ["Task1", "Task1", "Task1", "Task1"],
                [
                    "2022-01-01T12:00:00Z",
                    "2022-01-15T12:00:00Z",
                    "2022-01-22T12:00:00Z",
                    "2022-01-29T12:00:00Z",
                ],
            ),
            (
                """Flexible Task follows preferred days placement rule""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "preferred_days": [
                        {
                            "category": Categories.TRANSPORT.value,
                            "days": ["monday", "tuesday"],
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-01-31T08:00:00Z"],
            ),
            (
                """Flexible Task follows daily task limit placement rule""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-10T09:00:00Z"),
                                "end_datetime": parser.parse("2022-01-10T10:00:00Z"),
                            },
                        },
                        {
                            "task": {
                                "title": "Task2",
                                "start_datetime": parser.parse("2022-01-10T10:00:00Z"),
                                "end_datetime": parser.parse("2022-01-10T11:00:00Z"),
                            },
                        },
                    ],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task3",
                                "earliest_action_date": parser.parse(
                                    "2022-01-10"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "task_limits": [
                        {
                            "category": Categories.TRANSPORT.value,
                            "tasks_limit": 2,
                            "interval": "DAILY",
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1", "Task2", "Task3"],
                [
                    "2022-01-10T09:00:00Z",
                    "2022-01-10T10:00:00Z",
                    "2022-01-11T08:00:00Z",  # Next day as first day is full
                ],
            ),
            (
                """Flexible Task follows daily minute limit placement rule""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-10T09:00:00Z"),
                                "end_datetime": parser.parse("2022-01-10T10:00:00Z"),
                            },
                        },
                        {
                            "task": {
                                "title": "Task2",
                                "start_datetime": parser.parse("2022-01-10T10:00:00Z"),
                                "end_datetime": parser.parse("2022-01-10T11:00:00Z"),
                            },
                        },
                    ],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task3",
                                "earliest_action_date": parser.parse(
                                    "2022-01-10"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "task_limits": [
                        {
                            "category": Categories.TRANSPORT.value,
                            "minutes_limit": 120,
                            "interval": "DAILY",
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1", "Task2", "Task3"],
                [
                    "2022-01-10T09:00:00Z",
                    "2022-01-10T10:00:00Z",
                    "2022-01-11T08:00:00Z",  # Next day as first day is full
                ],
            ),
            (
                """Flexible Task follows birthday blocked days placement rule""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "blocked_days": {
                        "birthdays": {
                            "date": parser.parse("2022-01-27").date(),
                            "category": Categories.TRANSPORT.value,
                        },
                    },
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-01-28T08:00:00Z"],
            ),
            (
                "Flexible Task follows birthday blocked days placement rule - considers non-family members",
                {
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "TASK",
                                "earliest_action_date": parser.parse(
                                    "2023-07-10"
                                ).date(),
                                "due_date": parser.parse("2023-07-20").date(),
                                "duration": 30,
                            },
                            "include_non_family_members": True,
                        }
                    ],
                    "non_family_members": [
                        {
                            "blocked_days": {
                                "birthdays": {
                                    "date": parser.parse("2023-07-10").date(),
                                    "category": Categories.TRANSPORT.value,
                                },
                            }
                        }
                    ],
                },
                "20230701T00:00:00Z",
                "20230730T00:00:00Z",
                ["TASK"],
                ["2023-07-11T08:00:00Z"],
            ),
            (
                """Flexible Task follows family birthday blocked days placement rule""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "blocked_days": {
                        "family_birthdays": {
                            "date": parser.parse("2022-01-27").date(),
                            "category": Categories.TRANSPORT.value,
                        },
                    },
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-01-28T08:00:00Z"],
            ),
            (
                """Flexible Task follows national holidays blocked days placement rule""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "blocked_days": {
                        "national_holidays": {
                            "start_date": parser.parse("2022-01-27").date(),
                            "end_date": parser.parse("2022-01-31").date(),
                            "category": Categories.TRANSPORT.value,
                        },
                    },
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["TEST_HOLIDAY_TASK", "Task1"],
                [None, "2022-02-01T08:00:00Z"],
                None,
                ["2022-01-27", None],
            ),
            (
                """Flexible Task follows national holidays blocked days placement rule - considers non-family members""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                            "include_non_family_members": True,
                        }
                    ],
                    "non_family_members": [
                        {
                            "blocked_days": {
                                "national_holidays": {
                                    "start_date": parser.parse("2022-01-27").date(),
                                    "end_date": parser.parse("2022-01-31").date(),
                                    "category": Categories.TRANSPORT.value,
                                },
                            }
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-02-01T08:00:00Z"],
            ),
            (
                """Flexible Task follows days off blocked days placement rule""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "blocked_days": {
                        "days_off": {
                            "start_date": parser.parse("2022-01-27").date(),
                            "end_date": parser.parse("2022-01-31").date(),
                            "category": Categories.TRANSPORT.value,
                        },
                    },
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-02-01T08:00:00Z"],
            ),
            (
                """Flexible Task follows days off blocked days placement rule - considers non-family members""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                            "include_non_family_members": True,
                        }
                    ],
                    "non_family_members": [
                        {
                            "blocked_days": {
                                "days_off": {
                                    "start_date": parser.parse("2022-01-27").date(),
                                    "end_date": parser.parse("2022-01-31").date(),
                                    "category": Categories.TRANSPORT.value,
                                },
                            }
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-02-01T08:00:00Z"],
            ),
            (
                """Flexible Task follows trips blocked days placement rule""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "blocked_days": {
                        "trips": {
                            "start_date": parser.parse("2022-01-27").date(),
                            "end_date": parser.parse("2022-01-31").date(),
                            "category": Categories.TRANSPORT.value,
                        },
                    },
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-02-01T08:00:00Z"],
            ),
            (
                """Flexible Task follows school term blocked days placement rule""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "blocked_days": {
                        "term_times": {
                            "start_date": parser.parse("2022-01-27").date(),
                            "end_date": parser.parse("2022-01-31").date(),
                            "category": Categories.TRANSPORT.value,
                        },
                    },
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-02-01T08:00:00Z"],
            ),
            (
                """Flexible Task is placed around all members' tasks""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-01-28").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "family_members": [
                        {
                            "fixed_tasks": [
                                {
                                    "task": {
                                        "title": "FamilyMemberTask",
                                        "start_datetime": parser.parse(
                                            "2022-01-27T08:00:00Z"
                                        ),
                                        "end_datetime": parser.parse(
                                            "2022-01-27T09:00:00Z"
                                        ),
                                    }
                                },
                                {
                                    "task": {
                                        "title": "FamilyMemberTask",
                                        "start_datetime": parser.parse(
                                            "2022-01-28T08:00:00Z"
                                        ),
                                        "end_datetime": parser.parse(
                                            "2022-01-28T09:00:00Z"
                                        ),
                                    }
                                },
                            ]
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-01-27T09:00:00Z"],
            ),
            (
                """Flexible Task placement follows all members' birthday blocked days""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "family_members": [
                        {
                            "blocked_days": {
                                "birthdays": {
                                    "date": parser.parse("2022-01-27").date(),
                                    "category": Categories.TRANSPORT.value,
                                },
                            }
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-01-28T08:00:00Z"],
            ),
            (
                """Flexible Task placement follows all members' family birthday blocked days""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "family_members": [
                        {
                            "blocked_days": {
                                "family_birthdays": {
                                    "date": parser.parse("2022-01-27").date(),
                                    "category": Categories.TRANSPORT.value,
                                },
                            }
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-01-28T08:00:00Z"],
            ),
            (
                """Flexible Task placement follows all members' family birthday blocked days - considers non-family members""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                            "include_non_family_members": True,
                        }
                    ],
                    "non_family_members": [
                        {
                            "blocked_days": {
                                "family_birthdays": {
                                    "date": parser.parse("2022-01-27").date(),
                                    "category": Categories.TRANSPORT.value,
                                },
                            }
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-01-28T08:00:00Z"],
            ),
            (
                """Flexible Task placement follows all members' preferred days""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-27"
                                ).date(),
                                "due_date": parser.parse("2022-02-05").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "family_members": [
                        {
                            "preferred_days": [
                                {
                                    "category": Categories.TRANSPORT.value,
                                    "days": ["monday", "tuesday"],
                                }
                            ]
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-01-31T08:00:00Z"],
            ),
            (
                """Flexible Task placement follows all members' task limits""",
                {
                    "fixed_tasks": [],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "earliest_action_date": parser.parse(
                                    "2022-01-10"
                                ).date(),
                                "due_date": parser.parse("2022-01-20").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "family_members": [
                        {
                            "fixed_tasks": [
                                {
                                    "task": {
                                        "title": "Task1",
                                        "start_datetime": parser.parse(
                                            "2022-01-10T09:00:00Z"
                                        ),
                                        "end_datetime": parser.parse(
                                            "2022-01-10T10:00:00Z"
                                        ),
                                    },
                                },
                                {
                                    "task": {
                                        "title": "Task2",
                                        "start_datetime": parser.parse(
                                            "2022-01-10T10:00:00Z"
                                        ),
                                        "end_datetime": parser.parse(
                                            "2022-01-10T11:00:00Z"
                                        ),
                                    },
                                },
                            ],
                            "task_limits": [
                                {
                                    "category": Categories.TRANSPORT.value,
                                    "tasks_limit": 2,
                                    "interval": "DAILY",
                                }
                            ],
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task1"],
                ["2022-01-11T08:00:00Z"],
            ),
            (
                """Task limits should be per user""",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "Task1",
                                "start_datetime": parser.parse("2022-01-10T09:00:00Z"),
                                "end_datetime": parser.parse("2022-01-10T10:00:00Z"),
                            },
                            "exclude_family_members": True,
                        },
                        {
                            "task": {
                                "title": "TaskNextDay",
                                "start_datetime": parser.parse("2022-01-11T09:00:00Z"),
                                "end_datetime": parser.parse("2022-01-11T11:00:00Z"),
                            },
                            "exclude_family_members": True,
                        },
                    ],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task3",
                                "earliest_action_date": parser.parse(
                                    "2022-01-10"
                                ).date(),
                                "due_date": parser.parse("2022-01-11").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "family_members": [
                        {
                            "fixed_tasks": [
                                {
                                    "task": {
                                        "title": "Task2",
                                        "start_datetime": parser.parse(
                                            "2022-01-10T10:00:00Z"
                                        ),
                                        "end_datetime": parser.parse(
                                            "2022-01-10T11:00:00Z"
                                        ),
                                    },
                                },
                            ],
                            "task_limits": [
                                {
                                    "category": Categories.TRANSPORT.value,
                                    "tasks_limit": 2,
                                    "interval": "DAILY",
                                }
                            ],
                        }
                    ],
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task3", "Task1", "TaskNextDay"],
                [
                    "2022-01-10T08:00:00Z",
                    "2022-01-10T09:00:00Z",
                    "2022-01-11T09:00:00Z",
                ],
            ),
            (
                "Places a flexible task on task limited days rather than blocked days",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "TaskJan11",
                                "start_datetime": parser.parse("2022-01-11T09:00:00Z"),
                                "end_datetime": parser.parse("2022-01-11T11:00:00Z"),
                            },
                            "exclude_family_members": True,
                        },
                    ],
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task3",
                                "earliest_action_date": parser.parse(
                                    "2022-01-10"
                                ).date(),
                                "due_date": parser.parse("2022-01-11").date(),
                                "duration": 30,
                            },
                        }
                    ],
                    "task_limits": [  # Only one transport task per day
                        {
                            "category": Categories.TRANSPORT.value,
                            "tasks_limit": 1,
                            "interval": "DAILY",
                        }
                    ],
                    "blocked_days": {  # No transport tasks on my birthday
                        "family_birthdays": {
                            "date": parser.parse("2022-01-10").date(),
                            "category": Categories.TRANSPORT.value,
                        },
                    },
                },
                "20220101T00:00:00Z",
                "20220601T00:00:00Z",
                ["Task3", "TaskJan11"],
                ["2022-01-11T08:00:00Z", "2022-01-11T09:00:00Z"],
            ),
            (
                "Returns TaskAction scheduled tasks",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "DueDateTask",
                                "date": parser.parse("2022-01-29"),
                                "duration": 30,
                                "type": "DUE_DATE",
                            },
                            "exclude_family_members": True,
                            "actions": [{"action_timedelta": dt.timedelta(weeks=4)}],
                        },
                    ]
                },
                "20220101T00:00:00Z",
                "20220202T00:00:00Z",
                ["ACTION - DueDateTask", "DueDateTask"],
                None,
                ["2022-01-01", "2022-01-29"],
            ),
            (
                "Returns FixedTask objects with date and duration scheduled tasks",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "FixedTask",
                                "date": parser.parse("2022-01-29"),
                                "duration": 30,
                            },
                            "exclude_family_members": True,
                        },
                    ]
                },
                "20220101T00:00:00Z",
                "20220202T00:00:00Z",
                ["FixedTask"],
                None,
                ["2022-01-29"],
            ),
            (
                "Returns reoccurring FixedTask objects with date and duration scheduled tasks",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "FixedTask",
                                "date": parser.parse("2022-01-03"),
                                "duration": 30,
                            },
                            "recurrence": {"recurrence": "WEEKLY"},
                            "exclude_family_members": True,
                        },
                    ]
                },
                "20220101T00:00:00Z",
                "20220202T00:00:00Z",
                ["FixedTask", "FixedTask", "FixedTask", "FixedTask", "FixedTask"],
                None,
                ["2022-01-03", "2022-01-10", "2022-01-17", "2022-01-24", "2022-01-31"],
            ),
            (
                "Returns appointment shared by family member",
                {
                    "family_members": [
                        {
                            "fixed_tasks": [
                                {
                                    "task": {
                                        "title": "FamilyMemberTask",
                                        "type": "APPOINTMENT",
                                        "start_datetime": parser.parse(
                                            "2022-01-27T08:00:00Z"
                                        ),
                                        "end_datetime": parser.parse(
                                            "2022-01-27T09:00:00Z"
                                        ),
                                    }
                                }
                            ],
                            "category_view_permissions": [Categories.TRANSPORT.value],
                        }
                    ]
                },
                "20220101T00:00:00Z",
                "20220202T00:00:00Z",
                ["FamilyMemberTask"],
                ["2022-01-27T08:00:00Z"],
                None,
            ),
            (
                "Places flexible task in routine where possible",
                {
                    "flexible_tasks": [
                        {
                            "task": {
                                "title": "Task3",
                                "earliest_action_date": parser.parse(
                                    "2023-07-10"
                                ).date(),
                                "due_date": parser.parse("2023-07-20").date(),
                                "duration": 30,
                            },
                            "routine": {
                                "thursday": True,
                                "start_time": "12:00:00",
                                "end_time": "15:00:00",
                            },
                        }
                    ],
                },
                "20230710T00:00:00Z",
                "20230720T00:00:00Z",
                ["Task3"],
                ["2023-07-13T12:00:00Z"],  # The first Thursday in the time period
            ),
            (
                "Returns task with start_date and end_date",
                {
                    "fixed_tasks": [
                        {
                            "task": {
                                "title": "TASK",
                                "start_date": parser.parse("2023-07-10").date(),
                                "end_date": parser.parse("2023-07-20").date(),
                            }
                        }
                    ],
                },
                "20230701T00:00:00Z",
                "20230730T00:00:00Z",
                ["TASK"],
                [],
                [],
                ["2023-07-10"],
            ),
        ]
    )
    def test_responses(
        self,
        _,
        opts,
        filter_start_datetime,
        filter_end_datetime,
        expected_response_titles,
        expected_task_datetimes=None,
        expected_task_dates=None,
        expected_task_start_dates=None,
    ):
        """Test responses from the scheduling engine"""
        family = Family.objects.create()
        user = User.objects.create(
            username="test@test.test", phone_number="+447814187441", family=family
        )
        user_entity = Entity.objects.create(
            name="Test Entity",
            owner=user,
            category=Categories.TRANSPORT.value,
        )
        user_entity.members.add(user)
        user_entity.save()

        if opts.get("family_members"):
            for i, member_opts in enumerate(opts.get("family_members")):
                family_user = User.objects.create(
                    username=f"test{i}@test.test",
                    phone_number=f"+44745645645{i}",
                    family=family,
                )
                if member_opts.get("fixed_tasks"):
                    member_entity = Entity.objects.create(
                        name="Family Member Entity",
                        owner=family_user,
                        category=Categories.TRANSPORT.value,
                    )
                    member_entity.members.add(family_user)
                    member_entity.save()
                    for fixed_task in member_opts.get("fixed_tasks"):
                        task = FixedTask.objects.create(**fixed_task["task"])
                        task.entities.add(member_entity)
                        task.members.add(family_user)
                        task.save()

                blocked_days = member_opts.get("blocked_days")
                if blocked_days:
                    create_blocked_days(blocked_days, family_user)

                preferred_days = member_opts.get("preferred_days")
                if preferred_days:
                    create_preferred_days(preferred_days, family_user)

                task_limits = member_opts.get("task_limits")
                if task_limits:
                    create_task_limits(task_limits, family_user)

                category_view_permissions = member_opts.get("category_view_permissions")
                if category_view_permissions:
                    create_view_permissions(category_view_permissions, family_user)

        family.refresh_from_db()

        non_family_users = []
        if opts.get("non_family_members"):
            for i, member_opts in enumerate(opts.get("non_family_members")):
                non_user_family = Family.objects.create()
                non_family_user = User.objects.create(
                    username=f"test{i}@test.test",
                    phone_number=f"+44745645660{i}",
                    family=non_user_family,
                )
                if member_opts.get("fixed_tasks"):
                    member_entity = Entity.objects.create(
                        name="Non Family Member Entity",
                        owner=non_family_user,
                        category=Categories.TRANSPORT.value,
                    )
                    member_entity.members.add(non_family_user)
                    member_entity.save()
                    for fixed_task in member_opts.get("fixed_tasks"):
                        task = FixedTask.objects.create(**fixed_task["task"])
                        task.entities.add(member_entity)
                        task.members.add(non_family_user)
                        task.save()

                blocked_days = member_opts.get("blocked_days")
                if blocked_days:
                    create_blocked_days(blocked_days, non_family_user)

                preferred_days = member_opts.get("preferred_days")
                if preferred_days:
                    create_preferred_days(preferred_days, non_family_user)

                task_limits = member_opts.get("task_limits")
                if task_limits:
                    create_task_limits(task_limits, non_family_user)

                category_view_permissions = member_opts.get("category_view_permissions")
                if category_view_permissions:
                    create_view_permissions(category_view_permissions, non_family_user)

                non_family_users.append(non_family_user)

        for fixed_task in opts.get("fixed_tasks", []):
            task = FixedTask.objects.create(**fixed_task["task"])
            task.entities.add(user_entity)

            if fixed_task.get("exclude_family_members"):
                task.members.add(user)
                task.save()
            else:
                task.members.set(family.users.all())
                task.save()

            if fixed_task.get("include_non_family_members"):
                for user in non_family_users:
                    task.members.add(user)
                task.save()

            for task_action in fixed_task.get("actions", []):
                TaskAction.objects.create(
                    task=task, action_timedelta=task_action["action_timedelta"]
                )

            recurrence = (
                Recurrence.objects.create(**fixed_task["recurrence"], task=task)
                if fixed_task.get("recurrence")
                else None
            )

            for recurrence_override in fixed_task.get("overrides", []):
                if recurrence_override["task"]:
                    new_task = FixedTask.objects.create(
                        **recurrence_override["task"],
                    )
                    new_task.entities.add(user_entity)
                    new_task.save()
                else:
                    new_task = None

                if recurrence:
                    RecurrentTaskOverwrite.objects.create(
                        task=new_task,
                        recurrence=recurrence,
                        recurrence_index=recurrence_override["recurrence_index"],
                    )

        for flexible_task in opts.get("flexible_tasks", []):
            task = FlexibleTask.objects.create(**flexible_task["task"])
            task.entities.add(user_entity)

            if flexible_task.get("exclude_family_members"):
                task.members.add(user)
                task.save()
            else:
                task.members.set(family.users.all())
                task.save()

            if flexible_task.get("include_non_family_members"):
                for non_family_user in non_family_users:
                    task.members.add(non_family_user)
                task.save()

            recurrence = (
                Recurrence.objects.create(**flexible_task["recurrence"], task=task)
                if flexible_task.get("recurrence")
                else None
            )

            for recurrence_override in flexible_task.get("overrides", []):
                new_task = FlexibleTask.objects.create(
                    **recurrence_override["task"],
                )
                new_task.entities.add(user_entity)
                new_task.save()

                if recurrence:
                    RecurrentTaskOverwrite.objects.create(
                        task=new_task,
                        recurrence=recurrence,
                        recurrence_index=recurrence_override["recurrence_index"],
                    )

            if flexible_task.get("routine"):
                routine = Routine.objects.create(
                    **flexible_task.get("routine"),
                )
                routine.members.set(family.users.all())
                routine.save()

                task.routine = routine
                task.save()

        preferred_days = opts.get("preferred_days")
        if preferred_days:
            create_preferred_days(preferred_days, user)

        task_limits = opts.get("task_limits")
        if task_limits:
            create_task_limits(task_limits, user)

        blocked_days = opts.get("blocked_days")
        if blocked_days:
            create_blocked_days(blocked_days, user)

        self.client.force_login(user)

        query_params = {}
        if filter_start_datetime:
            query_params["earliest_datetime"] = filter_start_datetime

        if filter_end_datetime:
            query_params["latest_datetime"] = filter_end_datetime

        res = self.client.get(self.url, query_params)
        res_data = res.json()

        self.assertEqual(
            [task["title"] for task in res_data["tasks"]], expected_response_titles
        )

        for task in res_data["tasks"]:
            self.assertTrue(isinstance(task["entities"], list))

        if expected_task_datetimes:
            self.assertEqual(
                [task["start_datetime"] for task in res_data["tasks"]],
                expected_task_datetimes,
            )

        if expected_task_dates:
            self.assertEqual(
                [task["date"] for task in res_data["tasks"]], expected_task_dates
            )

        if expected_task_start_dates:
            self.assertEqual(
                [task["start_date"] for task in res_data["tasks"]],
                expected_task_start_dates,
            )

    def test_schedules_event(self):
        """test_schedules_event"""
        family = Family.objects.create()
        user = User.objects.create(
            username="test@test.test", phone_number="+447814187441", family=family
        )
        user_entity = Event.objects.create(
            name="Test Event",
            owner=user,
            category=Categories.SOCIAL_INTERESTS.value,
            start_datetime=dt.datetime(year=2023, month=8, day=4, hour=12, minute=30),
            end_datetime=dt.datetime(year=2023, month=8, day=4, hour=16, minute=30),
        )
        user_entity.members.add(user)
        user_entity.save()

        self.client.force_login(user)
        res = self.client.get(
            self.url,
            {
                "earliest_datetime": "20230701T00:00:00Z",
                "latest_datetime": "20230901T00:00:00Z",
            },
        )

        res_data = res.json()
        res_entities = res_data["entities"]

        self.assertEqual([ent["id"] for ent in res_entities], [user_entity.id])

    def test_schedules_pet_birthday(self):
        """test_schedules_pet_birthday"""
        family = Family.objects.create()
        user = User.objects.create(
            username="test@test.test", phone_number="+447814187441", family=family
        )
        user_entity = Pet.objects.create(
            name="Test Event",
            owner=user,
            dob=dt.date(year=2020, month=8, day=3),
            category=Categories.PETS.value,
        )
        user_entity.members.add(user)
        user_entity.save()

        self.client.force_login(user)
        res = self.client.get(
            self.url,
            {
                "earliest_datetime": "20230701T00:00:00Z",
                "latest_datetime": "20230901T00:00:00Z",
            },
        )

        res_data = res.json()
        res_entities = res_data["entities"]

        self.assertEqual([ent["id"] for ent in res_entities], [user_entity.id])
        self.assertEqual([ent["start_date"] for ent in res_entities], ["2023-08-03"])

    def test_schedules_user_birthday(self):
        """test_schedules_user_birthday"""
        dob = dt.date(year=2022, month=1, day=10)
        family = Family.objects.create()
        user = User.objects.create(
            username="test@test.test",
            phone_number="+447814187441",
            family=family,
            dob=dob,
            first_name="TEST",
        )
        self.client.force_login(user)
        res = self.client.get(
            self.url,
            {
                "earliest_datetime": "20230109T00:00:00Z",
                "latest_datetime": "20230111T00:00:00Z",
            },
        )

        res_data = res.json()
        res_tasks = res_data["tasks"]

        birthday_task = UserBirthdayTask.objects.get(user=user)
        self.assertEqual([task["id"] for task in res_tasks], [birthday_task.id])
