import django
from django.utils import timezone

from core.models.tasks.base import FixedTask, TaskReminder
from notifications.utils.send_reminders import send_due_reminders

django.setup()

import logging
from datetime import datetime, timedelta
from unittest.mock import patch

import pytz
from dateutil.tz import tzlocal
from django.contrib.auth.hashers import make_password
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.users.user_models import User
from notifications.models import PushToken
from notifications.utils.send_notification import send_push_message_if_valid
from notifications.views import PushTokenViewSet

utc = pytz.UTC


class TestSendReminders(TestCase):
    """Tests for the send_reminders functions"""

    def setUp(self):
        test_phone_number = "+447123456789"
        test_token = "KJGHHJGHJ"
        self.user = User.objects.create(phone_number=test_phone_number)
        self.push_token = PushToken.objects.create(token=test_token, user=self.user)

    @patch("notifications.utils.send_reminders.send_push_message_if_valid")
    def test_send_due_reminders_for_fixed_task(self, msend_message):
        """test_send_due_reminders_for_fixed_task"""
        now = timezone.now()
        task = FixedTask.objects.create(
            title="Fixed Task",
            start_datetime=now + timedelta(days=1),
            end_datetime=now + timedelta(days=1, minutes=15),
        )
        task.members.set([self.user])

        reminder = TaskReminder.objects.create(
            task=task, timedelta=timedelta(days=1, minutes=1)
        )

        send_due_reminders()
        msend_message.assert_called_once_with(
            self.push_token,
            f"REMINDER - {task.title} {task.start_datetime.strftime('%H:%M GMT on %d/%m/%Y')}",
        )
