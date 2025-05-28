"""Anniversary-specific tasks"""

import logging
from typing import cast

from django.db import models

from core.models.tasks.base import FixedTask, Recurrence
from core.models.users.user_models import User

logger = logging.getLogger(__name__)


class AnniversaryTask(FixedTask):
    """AnniversaryTask"""

    known_year = models.BooleanField(null=False, blank=False, default=False)


class BirthdayTask(AnniversaryTask):
    """BirthdayTask"""

    first_name = models.CharField(null=False, blank=False, max_length=100)
    last_name = models.CharField(null=False, blank=True, max_length=100, default="")


class UserBirthdayTask(FixedTask):
    """UserBirthdayTask"""

    user = models.ForeignKey("User", null=False, blank=False, on_delete=models.CASCADE)

    def save(self, *args, **kwargs):
        user = cast(User, self.user)

        self.start_datetime = None
        self.end_datetime = None
        self.start_timezone = None
        self.end_timezone = None
        self.date = None
        self.duration = None
        self.start_date = user.dob
        self.end_date = user.dob
        self.type = "USER_BIRTHDAY"

        res = super().save(*args, **kwargs)

        if not hasattr(self, "recurrence"):
            Recurrence.objects.create(recurrence="YEARLY", task=self)

        family = user.family
        if family:
            self.members.set(list(family.users.all()))
        else:
            self.members.set([self.user])

        return res
