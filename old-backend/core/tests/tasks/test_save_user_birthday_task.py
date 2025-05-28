import datetime as dt

import pytz
from django.test import TestCase

from core.models.tasks.anniversaries import UserBirthdayTask
from core.models.users.user_models import Family, User

utc = pytz.UTC


class TestSaveUserBirthdayTask(TestCase):
    """TestSaveUserBirthdayTask"""

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

    def test_save_user_birthday(self):
        """test_save_user_birthday"""
        task = UserBirthdayTask.objects.create(user=self.user, title="__BIRTHDAY__")
        self.assertEqual(set(task.members.all()), {self.user, self.family_member})
        self.assertEqual(task.start_date, self.user.dob)
        self.assertEqual(task.end_date, self.user.dob)
        self.assertEqual(task.start_datetime, None)
        self.assertEqual(task.end_datetime, None)
        self.assertEqual(task.date, None)
        self.assertEqual(task.duration, None)

        recurrence = task.recurrence
        self.assertEqual(recurrence.recurrence, "YEARLY")
