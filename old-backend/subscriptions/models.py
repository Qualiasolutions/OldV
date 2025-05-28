"""Subscription models"""

from django.db import models

TYPE_CHOICES = [
    ("MONTHLY", "Monthly"),
    ("YEARLY", "Yearly"),
]


class Subscription(models.Model):
    """Subscription"""

    user = models.ForeignKey(
        "core.User",
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="subscriptions",
    )
    type = models.CharField(
        choices=TYPE_CHOICES, max_length=31, null=False, blank=False, default="MONTHLY"
    )
    customer_id = models.CharField(max_length=127, null=False, blank=False, default="")
    subscription_id = models.CharField(
        max_length=127, null=False, blank=False, default=""
    )
    paused = models.BooleanField(null=False, blank=False, default=False)
    is_family = models.BooleanField(null=False, blank=False, default=False)
