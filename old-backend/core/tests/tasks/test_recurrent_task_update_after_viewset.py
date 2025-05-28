"""TestRecurrentTaskOverwriteViewSet"""

import datetime as dt
import logging

import pytz
from dateutil import parser
from dateutil.tz import tzlocal
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity
from core.models.tasks.base import FixedTask, Recurrence, Task
from core.models.users.user_models import User
from core.utils.categories import Categories
from core.views.task_viewsets import RecurrentTaskUpdateAfterViewSet

utc = pytz.UTC

logger = logging.getLogger(__name__)


class TestRecurrentTaskOverwriteViewSet(TestCase):
    """TestRecurrentTaskOverwriteViewSet"""

    def setUp(self):
        self.user = User.objects.create(
            username="Test User", phone_number="+447814187441"
        )
        self.entity = Entity.objects.create(
            name="Test Entity", owner=self.user, category=Categories.TRANSPORT.value
        )

        self.task = FixedTask.objects.create(
            title="Test Task",
            start_datetime=dt.datetime.now(tzlocal()),
            end_datetime=dt.datetime.now(tzlocal()),
        )
        self.task.entities.add(self.entity)
        self.task.members.add(self.user)
        self.task.save()

        self.recurrence = Recurrence.objects.create(task=self.task, recurrence="WEEKLY")

    def test_auth_required(self):
        """test_auth_required"""
        request = APIRequestFactory().post("", {}, format="json")
        task_viewset = RecurrentTaskUpdateAfterViewSet.as_view({"post": "create"})
        res = task_viewset(request)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_can_overwrite_after_specific_point(self):
        """test_can_overwrite_after_specific_point"""
        updated_start_datetime = "2022-01-01T10:00:00Z"
        change_datetime = "2022-01-01T09:00:00Z"
        request = APIRequestFactory().post(
            "",
            {
                "task": {
                    "start_datetime": updated_start_datetime,
                    "resourcetype": "FixedTask",
                },
                "recurrence": self.recurrence.id,
                "change_datetime": change_datetime,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        task_viewset = RecurrentTaskUpdateAfterViewSet.as_view({"post": "create"})
        res = task_viewset(request)

        # Recurrence created with same frequency etc
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["start_datetime"], updated_start_datetime)

    def test_overwrite_resourcetype_should_match(self):
        """test_overwrite_resourcetype_should_match"""
        change_datetime = "2022-01-01T09:00:00Z"
        request = APIRequestFactory().post(
            "",
            {
                "task": {"resourcetype": "FlexibleTask"},
                "recurrence": self.recurrence.id,
                "change_datetime": change_datetime,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        task_viewset = RecurrentTaskUpdateAfterViewSet.as_view({"post": "create"})
        res = task_viewset(request)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res.data["resourcetype"].title().lower(),
            "resourcetype must match base task",
        )

    def test_can_update_recurrence_frequency_after_specific_point(self):
        """test_can_update_recurrence_frequency_after_specific_point"""
        updated_start_datetime = "2022-01-01T10:00:00Z"
        change_datetime = "2022-01-01T09:00:00Z"
        request = APIRequestFactory().post(
            "",
            {
                "task": {
                    "start_datetime": updated_start_datetime,
                    "resourcetype": "FixedTask",
                    "recurrence": {
                        "recurrence": "DAILY",
                        "earliest_occurrence": "2022-10-10T10:00:00Z",
                        "latest_occurrence": None,
                        "interval_length": 1,
                    },
                },
                "recurrence": self.recurrence.id,
                "change_datetime": change_datetime,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        task_viewset = RecurrentTaskUpdateAfterViewSet.as_view({"post": "create"})
        res = task_viewset(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["start_datetime"], updated_start_datetime)

        new_task = Task.objects.get(id=res.data["id"])
        self.assertEqual(new_task.recurrence.recurrence, "DAILY")

    def test_can_update_due_date_recurrence_frequency(self):
        """test_can_update_due_date_recurrence_frequency"""
        updated_date = "2022-01-01"
        self.task.start_datetime = None
        self.task.end_datetime = None
        self.task.date = dt.date(year=2021, month=6, day=6)
        self.task.duration = 30
        self.task.save()

        request = APIRequestFactory().post(
            "",
            {
                "task": {
                    "date": updated_date,
                    "resourcetype": "FixedTask",
                    "recurrence": {
                        "recurrence": "DAILY",
                        "earliest_occurrence": None,
                        "latest_occurrence": None,
                        "interval_length": 1,
                    },
                },
                "recurrence": self.recurrence.id,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        task_viewset = RecurrentTaskUpdateAfterViewSet.as_view({"post": "create"})
        res = task_viewset(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["date"], updated_date)

        new_task = Task.objects.get(id=res.data["id"])
        self.assertEqual(new_task.recurrence.recurrence, "DAILY")

    def test_delete_after_specific_point(self):
        """test_delete_after_specific_point"""
        change_datetime = "2022-01-01T09:00:00Z"
        request = APIRequestFactory().post(
            "",
            {
                "task": None,
                "recurrence": self.recurrence.id,
                "change_datetime": change_datetime,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        task_viewset = RecurrentTaskUpdateAfterViewSet.as_view({"post": "create"})
        res = task_viewset(request)

        # Recurrence created with same frequency etc
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        self.recurrence.refresh_from_db()
        self.assertEqual(
            self.recurrence.latest_occurrence, parser.parse(change_datetime)
        )
