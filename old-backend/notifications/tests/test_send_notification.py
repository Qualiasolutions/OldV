import django

django.setup()

from datetime import datetime, timedelta
from unittest.mock import patch

import pytz
from dateutil.tz import tzlocal
from django.test import TestCase

from core.models.users.user_models import User
from notifications.models import PushToken
from notifications.utils.send_notification import send_push_message_if_valid

utc = pytz.UTC


class TestSendNotification(TestCase):
    @patch("notifications.utils.send_notification.send_push_message")
    def test_send_push_message_if_valid_valid_push_token(self, send_push_message):
        test_phone_number = "+447123456789"
        test_token = "KJGHHJGHJ"
        test_message = "MESSAGE"
        user = User.objects.create(phone_number=test_phone_number)

        valid_push_token = PushToken.objects.create(token=test_token, user=user)
        send_push_message_if_valid(valid_push_token, test_message)
        send_push_message.assert_called_with(valid_push_token, test_message, extra=None)

    @patch("notifications.utils.send_notification.send_push_message")
    def test_send_push_message_if_valid_old_but_valid_push_token(
        self, send_push_message
    ):
        test_phone_number = "+447123456789"
        test_token = "KJGHHJGHJ"
        test_message = "MESSAGE"
        user = User.objects.create(phone_number=test_phone_number)

        valid_push_token = PushToken.objects.create(token=test_token, user=user)
        PushToken.objects.filter(id=valid_push_token.id).update(
            last_active=datetime.now(tzlocal()) - timedelta(days=89)
        )
        valid_push_token = PushToken.objects.get(id=valid_push_token.id)

        send_push_message_if_valid(valid_push_token, test_message)
        send_push_message.assert_called_with(valid_push_token, test_message, extra=None)

    @patch("notifications.utils.send_notification.send_push_message")
    def test_send_push_message_if_valid_inactive_push_token(self, send_push_message):
        test_phone_number = "+447123456789"
        test_token = "KJGHHJGHJ"
        test_message = "MESSAGE"
        user = User.objects.create(phone_number=test_phone_number)

        inactive_push_token = PushToken.objects.create(
            token=test_token, user=user, active=False
        )
        send_push_message_if_valid(inactive_push_token, test_message)
        send_push_message.assert_not_called()

    @patch("notifications.utils.send_notification.send_push_message")
    def test_send_push_message_if_valid_expired_push_token(self, send_push_message):
        test_phone_number = "+447123456789"
        test_token = "KJGHHJGHJ"
        test_message = "MESSAGE"
        user = User.objects.create(phone_number=test_phone_number)

        expired_push_token = PushToken.objects.create(token=test_token, user=user)
        PushToken.objects.filter(id=expired_push_token.id).update(
            last_active=datetime.now(tzlocal()) - timedelta(days=91)
        )
        expired_push_token = PushToken.objects.get(id=expired_push_token.id)
        send_push_message_if_valid(expired_push_token, test_message)
        send_push_message.assert_not_called()
