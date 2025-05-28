from django.db import models

from django.conf import settings

from core.utils.categories import Categories


class PreferredDays(models.Model):
    """A model for determining the preferred days for task placement"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="preferred_day_config",
        null=False,
        blank=True,
    )
    category = models.IntegerField(choices=[(e.value, e.name) for e in Categories])

    monday = models.BooleanField(null=False, blank=True, default=False)
    tuesday = models.BooleanField(null=False, blank=True, default=False)
    wednesday = models.BooleanField(null=False, blank=True, default=False)
    thursday = models.BooleanField(null=False, blank=True, default=False)
    friday = models.BooleanField(null=False, blank=True, default=False)
    saturday = models.BooleanField(null=False, blank=True, default=False)
    sunday = models.BooleanField(null=False, blank=True, default=False)
