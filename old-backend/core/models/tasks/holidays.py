"""Holiday-specific tasks"""

from django.db import models

from core.models.tasks.base import FixedTask


class HolidayTask(FixedTask):
    """HolidayTask"""

    string_id: models.CharField = models.CharField(
        max_length=100, null=False, blank=True, default=""
    )
    country_code: models.CharField = models.CharField(
        max_length=3, null=False, blank=True, default=""
    )
    custom: models.BooleanField = models.BooleanField(
        null=False, blank=True, default=False
    )
