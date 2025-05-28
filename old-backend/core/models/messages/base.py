"""Models for messages"""

from django.conf import settings
from django.db.models import (
    CASCADE,
    DateTimeField,
    ForeignKey,
    IntegerField,
    Model,
    TextField,
)

from core.models.entities.base import Entity
from core.models.tasks.base import Task, TaskAction


class Message(Model):
    """A message from a user"""

    text = TextField(null=False, blank=False)
    created_at = DateTimeField(null=False, blank=False, auto_now_add=True)
    user = ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=CASCADE,
        related_name="messages",
        null=False,
        blank=False,
    )
    task = ForeignKey(
        Task,
        on_delete=CASCADE,
        related_name="messages",
        null=True,
        blank=True,
    )
    entity = ForeignKey(
        Entity,
        on_delete=CASCADE,
        related_name="messages",
        null=True,
        blank=True,
    )
    action = ForeignKey(
        TaskAction,
        on_delete=CASCADE,
        related_name="messages",
        null=True,
        blank=True,
    )
    recurrence_index = IntegerField(null=True, blank=True)
