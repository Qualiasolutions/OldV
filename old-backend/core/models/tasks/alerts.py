"""Models for alerts"""

from enum import Enum
from typing import List, Literal, Tuple

from django.db import models

from core.models.tasks.base import Task, TaskAction
from core.models.users.user_models import User

AlertName = Literal[
    "TASK_LIMIT_EXCEEDED", "TASK_CONFLICT", "BLOCKED_DAY", "UNPREFERRED_DAY"
]


class Alerts(Enum):
    """Alerts"""

    TASK_LIMIT_EXCEEDED = "TASK_LIMIT_EXCEEDED"
    TASK_CONFLICT = "TASK_CONFLICT"
    UNPREFERRED_DAY = "UNPREFERRED_DAY"
    BLOCKED_DAY = "BLOCKED_DAY"


ALERT_TYPES: List[AlertName] = [alert.value for alert in Alerts]

AlertTagChoice = Tuple[AlertName, str]
AlertTagChoices = List[AlertTagChoice]


ALERTS_CHOICES: AlertTagChoices = [
    ("TASK_LIMIT_EXCEEDED", "Task limit exceeded"),
    ("TASK_CONFLICT", "Task conflict"),
    ("BLOCKED_DAY", "Blocked day"),
    ("UNPREFERRED_DAY", "Unpreferred day"),
]


class Alert(models.Model):
    """Task placement alert model"""

    task = models.ForeignKey(
        Task, null=False, blank=False, on_delete=models.CASCADE, related_name="alerts"
    )
    user = models.ForeignKey(
        User, null=False, blank=False, on_delete=models.CASCADE, related_name="alerts"
    )
    type = models.CharField(
        choices=ALERTS_CHOICES, max_length=31, blank=False, null=False
    )
    read = models.BooleanField(blank=True, null=False, default=False)


class ActionAlert(models.Model):
    """TaskAction placement alert model"""

    action = models.ForeignKey(
        TaskAction,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="action_alerts",
    )
    user = models.ForeignKey(
        User,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="action_alerts",
    )
    type = models.CharField(
        choices=ALERTS_CHOICES, max_length=31, blank=False, null=False
    )
    read = models.BooleanField(blank=True, null=False, default=False)
