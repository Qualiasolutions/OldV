"""Routine models"""

from django.db import models

from core.models.users.user_models import User


class Routine(models.Model):
    """A model for creating Routine objects"""

    name = models.CharField(null=False, blank=False, default="", max_length=127)
    monday = models.BooleanField(null=False, blank=True, default=False)
    tuesday = models.BooleanField(null=False, blank=True, default=False)
    wednesday = models.BooleanField(null=False, blank=True, default=False)
    thursday = models.BooleanField(null=False, blank=True, default=False)
    friday = models.BooleanField(null=False, blank=True, default=False)
    saturday = models.BooleanField(null=False, blank=True, default=False)
    sunday = models.BooleanField(null=False, blank=True, default=False)

    members = models.ManyToManyField(
        User,
        related_name="routines",
    )

    start_time = models.TimeField(null=False, blank=False)
    end_time = models.TimeField(null=False, blank=False)

    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.pk})"
