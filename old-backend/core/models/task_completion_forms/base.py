"""Task completion form models"""

from django.db import models

from core.models.tasks.base import Task


class TaskCompletionForm(models.Model):
    """This is the basis for marking a task as complete.
    A task is complete if and only if there is an associated TaskCompletionForm
    object for that task. Note that the recurrence_index attribute can be used
    to specify completion of specific occurrences of a task.
    """

    completion_datetime = models.DateTimeField(
        null=False, blank=False, auto_now_add=True
    )
    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="completion_form",
    )
    recurrence_index = models.IntegerField(null=True, blank=True)

    ignore = models.BooleanField(null=False, blank=True, default=False)
    complete = models.BooleanField(null=False, blank=True, default=True)
    partial = models.BooleanField(null=False, blank=True, default=False)
