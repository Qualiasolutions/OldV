"""Tests for completion form viewset"""

import logging

from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity
from core.models.task_completion_forms.base import TaskCompletionForm
from core.models.tasks.base import FixedTask
from core.models.users.user_models import Family, User
from core.utils.categories import Categories
from core.views.task_completion_form_viewsets import TaskCompletionFormViewSet

logger = logging.getLogger(__name__)


class TestTaskCompletionFormViewSet(TestCase):
    """TestTaskCompletionFormViewSet"""

    def setUp(self):
        family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=family
        )
        self.entity = Entity.objects.create(
            name="Test Entity",
            owner=self.user,
            category=Categories.TRANSPORT.value,
        )
        self.fixed_task = FixedTask.objects.create(
            title="A FIXED TASK",
            start_datetime=timezone.now(),
            end_datetime=timezone.now(),
        )
        self.fixed_task.entities.add(self.entity)
        self.fixed_task.save()

        self.create_view = TaskCompletionFormViewSet.as_view({"post": "create"})

    def test_fixed_task_completion_form(self):
        """test_fixed_task_completion_form"""
        req = APIRequestFactory().post(
            "",
            {
                "task": self.fixed_task.id,
            },
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_fixed_task_completion_form_ignore(self):
        """test_fixed_task_completion_form_ignore"""
        req = APIRequestFactory().post(
            "",
            {
                "task": self.fixed_task.id,
                "ignore": True,
            },
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_can_create_multiple_with_different_recurrence(self):
        """test_can_create_multiple_with_different_recurrence"""
        request_body = {
            "task": self.fixed_task.id,
            "recurrence_index": 1,
        }

        req = APIRequestFactory().post(
            "",
            request_body,
            format="json",
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        req = APIRequestFactory().post(
            "",
            {**request_body, "recurrence_index": 2},
            format="json",
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_can_bulk_create(self):
        """test_can_bulk_create"""
        request_body = [
            {
                "task": self.fixed_task.id,
                "recurrence_index": 1,
            },
            {
                "task": self.fixed_task.id,
                "recurrence_index": 2,
            },
        ]

        req = APIRequestFactory().post(
            "",
            request_body,
            format="json",
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TaskCompletionForm.objects.count(), 2)
