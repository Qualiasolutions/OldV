"""Task Limit models"""

from django.conf import settings
from django.db import models

from core.utils.categories import Categories

INTERVAL_CHOICES = [("DAILY", "Daily"), ("MONTHLY", "Monthly")]


class TaskLimit(models.Model):
    """Defines limits on how many / what duration of tasks
    may be placed within a given timeframe for each category
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="task_limits",
        null=False,
        blank=True,
    )
    category = models.IntegerField(choices=[(e.value, e.name) for e in Categories])
    minutes_limit = models.IntegerField(null=True, blank=True)
    tasks_limit = models.IntegerField(null=True, blank=True)
    interval = models.CharField(
        null=False, blank=False, choices=INTERVAL_CHOICES, max_length=31
    )
