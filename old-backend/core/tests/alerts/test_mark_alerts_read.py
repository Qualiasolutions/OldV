"""Tests for mark_alerts_read view"""
from typing import List

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.tasks.alerts import ActionAlert, Alert
from core.models.tasks.base import Task, TaskAction
from core.models.users.user_models import Family, User
from core.views.alerts_viewsets import mark_alerts_read


class MarkAlertsReadViewTests(TestCase):
    """MarkAlertsReadViewTests"""

    def setUp(self):
        family = Family.objects.create()
        self.user = User.objects.create(
            username="07123123123", phone_number="07123123123", family=family
        )

    def test_mark_alerts_read(self):
        """test_mark_alerts_read"""

        task_alerts: List[Alert] = []
        action_alerts: List[ActionAlert] = []
        for i in range(10):
            task = Task.objects.create(title=f"TASK_{i}")
            action = TaskAction.objects.create(task=task)
            task.members.set([self.user])
            alert = Alert.objects.create(task=task, user=self.user)
            action_alert = ActionAlert.objects.create(action=action, user=self.user)
            task_alerts.append(alert)
            action_alerts.append(action_alert)

        for alert in task_alerts:
            alert.refresh_from_db()
            self.assertFalse(alert.read)

        for action_alert in action_alerts:
            action_alert.refresh_from_db()
            self.assertFalse(action_alert.read)

        request = APIRequestFactory().post("", {"user": self.user.id}, format="json")
        force_authenticate(request, self.user)
        res = mark_alerts_read(request)

        self.assertEqual(res.status_code, status.HTTP_200_OK)

        for alert in task_alerts:
            alert.refresh_from_db()
            self.assertTrue(alert.read)

        for action_alert in action_alerts:
            action_alert.refresh_from_db()
            self.assertTrue(action_alert.read)
