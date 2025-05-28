import datetime as dt

import pytz
from dateutil.tz import tzlocal
from django.test import TestCase
from parameterized import parameterized  # type: ignore
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity
from core.models.tasks.base import FixedTask, Recurrence
from core.models.users.user_models import User
from core.utils.categories import Categories
from core.views.task_viewsets import TaskViewSet

utc = pytz.UTC


class TestFixedTaskViewSet(TestCase):
    """TestFixedTaskViewSet"""

    def test_auth_required(self):
        """test_auth_required"""
        request = APIRequestFactory().post("", {}, format="json")
        task_viewset = TaskViewSet.as_view({"post": "create"})
        res = task_viewset(request)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    @parameterized.expand(
        [
            ("Cannot update start_datetime", "start_datetime", "2022-10-10T10:00:00Z"),
            ("Cannot update end_datetime", "end_datetime", "2022-10-10T10:00:00Z"),
        ]
    )
    def test_cannot_update_if_recurrent(self, _, field_name, field_value):
        """test_cannot_update_if_recurrent"""
        user = User.objects.create(username="Test User", phone_number="+447814187441")
        entity = Entity.objects.create(
            name="Test Entity", owner=user, category=Categories.TRANSPORT.value
        )
        entity.members.add(user)
        entity.save()

        task = FixedTask.objects.create(
            title="Test Task",
            start_datetime=dt.datetime.now(tzlocal()),
            end_datetime=dt.datetime.now(tzlocal()),
        )
        task.entities.add(entity)
        task.save()

        Recurrence.objects.create(task=task, recurrence="WEEKLY")

        request = APIRequestFactory().post(
            "",
            {
                field_name: field_value,
                "resourcetype": "FixedTask",
            },
            format="json",
        )
        force_authenticate(request, user=user)

        task_viewset = TaskViewSet.as_view({"post": "partial_update"})
        res = task_viewset(request, pk=task.id)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(
            res.data[field_name][field_name]
            .title()
            .lower()
            .startswith(f"cannot update {field_name} of a task with recurrence")
        )
