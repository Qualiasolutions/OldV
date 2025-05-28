"""Notification models"""

from django.contrib.auth import get_user_model
from django.db import models


class PushToken(models.Model):
    """PushToken"""

    token = models.CharField(null=False, blank=True, default="", max_length=50)
    user = models.ForeignKey(
        get_user_model(),
        null=False,
        blank=True,
        on_delete=models.CASCADE,
        related_name="push_tokens",
    )
    active = models.BooleanField(null=False, blank=False, default=True)
    last_active = models.DateTimeField(null=True, blank=True, auto_now=True)
