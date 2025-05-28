import datetime as dt
import logging

import pytz
from django.test import TestCase

from core.models.tasks.anniversaries import UserBirthdayTask
from core.models.users.user_models import Family, User

utc = pytz.UTC

logger = logging.getLogger(__name__)


class TestSaveUser(TestCase):
    """TestSaveUser"""

    def setUp(self):
        test_phone = "+447123123123"
        other_test_phone = "+447111111111"
        self.family = Family.objects.create()
        self.user = User.objects.create(
            phone_number=test_phone,
            username=test_phone,
            dob=dt.date(year=2000, month=1, day=1),
            family=self.family,
        )
        self.family_member = User.objects.create(
            phone_number=other_test_phone,
            username=other_test_phone,
            dob=dt.date(year=2000, month=1, day=1),
            family=self.family,
        )

        self.user_birthday_task = UserBirthdayTask.objects.create(
            user=self.user, title="__BIRTHDAY__"
        )

    def test_create_user(self):
        """test_create_user"""
        new_user_phone = "+447222222222"
        family = Family.objects.create()
        user = User.objects.create(
            username=new_user_phone,
            phone_number=new_user_phone,
            first_name="TEST",
            family=family,
            dob=dt.date(year=2000, month=1, day=1),
        )
        self.assertTrue(
            UserBirthdayTask.objects.filter(user=user, title="TEST's Birthday").exists()
        )

    def test_update_user(self):
        """test_update_user"""
        new_dob = dt.date(year=2004, month=1, day=1)
        self.user.dob = new_dob
        self.user.save()

        self.user_birthday_task.refresh_from_db()
        self.assertEqual(self.user_birthday_task.start_date, new_dob)
        self.assertEqual(self.user_birthday_task.end_date, new_dob)
