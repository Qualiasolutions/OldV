from enum import IntEnum
from core.models.users.user_models import User

from django.db import models


class Days(IntEnum):
    """An enum for the days of the week"""

    MONDAY = 1
    TUESDAY = 2
    WEDNESDAY = 3
    THURSDAY = 4
    FRIDAY = 5
    SATURDAY = 6
    SUNDAY = 7


DAY_CHOICES = [(day.value, day.name) for day in Days]
DAY_MAPPING = {day.value: day.name for day in Days}


class TimeBlock(models.Model):
    """A model for creating TimeBlock objects"""

    day = models.IntegerField(choices=DAY_CHOICES)
    start_time = models.TimeField(null=False, blank=False)
    end_time = models.TimeField(null=False, blank=False)

    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True)

    members = models.ManyToManyField(
        User,
        related_name="timeblocks",
    )

    def __str__(self):
        return f"{DAY_MAPPING[self.day]} {self.start_time} - {self.end_time}"
