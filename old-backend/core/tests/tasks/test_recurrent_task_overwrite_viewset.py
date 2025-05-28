"""Tests for recurrent task overwrites"""

import datetime as dt
import logging

import pytz
from dateutil.tz import tzlocal
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity
from core.models.entities.career import (
    DaysOff,  # Seems to help with the initialization to include this
)
from core.models.routines.routines import Routine
from core.models.tasks.base import FixedTask, Recurrence, RecurrentTaskOverwrite
from core.models.users.user_models import Family, User
from core.utils.categories import Categories
from core.views.task_viewsets import RecurrentTaskOverwriteViewSet

utc = pytz.UTC


logger = logging.getLogger(__name__)


class TestRecurrentTaskOverwriteViewSet(TestCase):
    """TestRecurrentTaskOverwriteViewSet"""

    def setUp(self):
        self.family = Family.objects.create()
        self.user = User.objects.create(
            username="Test User", phone_number="+447814187441", family=self.family
        )
        self.other_user = User.objects.create(
            username="Test OTHER User", phone_number="+447814187444", family=self.family
        )
        self.entity = Entity.objects.create(
            name="Test Entity", owner=self.user, category=Categories.TRANSPORT.value
        )
        self.other_entity = Entity.objects.create(
            name="Test OTHER Entity",
            owner=self.user,
            category=Categories.TRANSPORT.value,
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
        task_viewset = RecurrentTaskOverwriteViewSet.as_view({"post": "create"})
        res = task_viewset(request)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_can_overwrite_single_occurrence(self):
        """test_can_overwrite_single_occurrence"""
        updated_start_datetime = "2022-01-01T10:00:00Z"
        request = APIRequestFactory().post(
            "",
            {
                "task": {
                    "start_datetime": updated_start_datetime,
                    "resourcetype": "FixedTask",
                },
                "recurrence": self.recurrence.id,
                "recurrence_index": 0,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        task_viewset = RecurrentTaskOverwriteViewSet.as_view({"post": "create"})
        res = task_viewset(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["task"]["start_datetime"], updated_start_datetime)

    def test_can_overwrite_single_occurrence_entities(self):
        """test_can_overwrite_single_occurrence_entities"""
        request = APIRequestFactory().post(
            "",
            {
                "task": {
                    "entities": [self.other_entity.id],
                    "resourcetype": "FixedTask",
                },
                "recurrence": self.recurrence.id,
                "recurrence_index": 0,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        task_viewset = RecurrentTaskOverwriteViewSet.as_view({"post": "create"})
        res = task_viewset(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["task"]["entities"], [self.other_entity.id])

    def test_can_overwrite_single_occurrence_members(self):
        """test_can_overwrite_single_occurrence_members"""
        request = APIRequestFactory().post(
            "",
            {
                "task": {
                    "members": [self.other_user.id],
                    "resourcetype": "FixedTask",
                },
                "recurrence": self.recurrence.id,
                "recurrence_index": 0,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        task_viewset = RecurrentTaskOverwriteViewSet.as_view({"post": "create"})
        res = task_viewset(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["task"]["members"], [self.other_user.id])

    def test_can_delete_existing_overwrite(self):
        """test_can_delete_existing_overwrite"""
        new_task = FixedTask.objects.create(
            title="Overwritten Task",
            start_datetime=dt.datetime.now(tzlocal()),
            end_datetime=dt.datetime.now(tzlocal()),
        )
        new_task.entities.add(self.entity)
        new_task.save()

        recurrent_task_overwrite = RecurrentTaskOverwrite.objects.create(
            task=new_task, recurrence=self.recurrence, recurrence_index=0
        )

        request = APIRequestFactory().delete("")
        force_authenticate(request, user=self.user)

        task_viewset = RecurrentTaskOverwriteViewSet.as_view({"delete": "destroy"})
        res = task_viewset(request, pk=recurrent_task_overwrite.id)

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

    def test_overwrite_resourcetype_should_match(self):
        """test_overwrite_resourcetype_should_match"""
        request = APIRequestFactory().post(
            "",
            {
                "task": {"resourcetype": "FlexibleTask"},
                "recurrence": self.recurrence.id,
                "recurrence_index": 0,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        task_viewset = RecurrentTaskOverwriteViewSet.as_view({"post": "create"})
        res = task_viewset(request)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(
            res.data["resourcetype"].title().lower(),
            "resourcetype must match base task",
        )

    def test_overwrite_routine_task(self):
        """test_overwrite_routine_task"""
        routine = Routine.objects.create(
            thursday=True,
            start_time="12:00:00",
            end_time="15:00:00",
        )
        self.task.routine = routine
        self.task.save()

        request = APIRequestFactory().post(
            "",
            {
                "task": {"resourcetype": "FixedTask"},
                "recurrence": self.recurrence.id,
                "recurrence_index": 0,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        task_viewset = RecurrentTaskOverwriteViewSet.as_view({"post": "create"})
        res = task_viewset(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_can_delete_single_occurrence(self):
        """test_can_delete_single_occurrence"""
        request = APIRequestFactory().post(
            "",
            {
                "task": None,
                "recurrence": self.recurrence.id,
                "recurrence_index": 0,
            },
            format="json",
        )
        force_authenticate(request, user=self.user)

        task_viewset = RecurrentTaskOverwriteViewSet.as_view({"post": "create"})
        res = task_viewset(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["task"], None)
