"""Base models for tasks"""

from datetime import timedelta
from typing import List, Literal, Optional, Tuple

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField  # type: ignore
from polymorphic.models import PolymorphicModel  # type: ignore
from timezone_field import TimeZoneField  # type: ignore

from core.models.entities.base import Entity
from core.models.routines.routines import Routine
from core.utils.tags import TAG_CHOICES

TASK_TYPE_CHOICES = [
    ("TASK", "Task"),
    ("APPOINTMENT", "Appointment"),
    ("DUE_DATE", "Due Date"),
    ("FLIGHT", "Flight"),
    ("TRAIN", "Train"),
    ("RENTAL_CAR", "Rental Car"),
    ("TAXI", "Taxi"),
    ("DRIVE_TIME", "Drive Time"),
    ("HOTEL", "Hotel"),
    ("STAY_WITH_FRIEND", "Stay With Friend"),
    ("ACTIVITY", "Activity"),
    ("FOOD_ACTIVITY", "Food"),
    ("OTHER_ACTIVITY", "Other Activity"),
    ("ANNIVERSARY", "Anniversary"),
    ("BIRTHDAY", "Birthday"),
    ("USER_BIRTHDAY", "User Birthday"),
    ("HOLIDAY", "Holiday"),
    ("ICAL_EVENT", "ICal Event"),
]


HiddenTagType = Literal[
    "MOT_DUE", "INSURANCE_DUE", "WARRANTY_DUE", "SERVICE_DUE", "TAX_DUE"
]
HiddenTagChoice = Tuple[HiddenTagType, str]
HiddenTagChoices = List[HiddenTagChoice]

HIDDEN_TAG_CHOICES: HiddenTagChoices = [
    ("MOT_DUE", "MOT"),
    ("INSURANCE_DUE", "Insurance Due"),
    ("WARRANTY_DUE", "Warranty Due"),
    ("SERVICE_DUE", "Service Due"),
    ("TAX_DUE", "Tax Due"),
]


class Task(PolymorphicModel):
    """Task"""

    recurrence: Optional["Recurrence"]

    title = models.CharField(max_length=200, null=False, blank=False, default=None)
    type = models.CharField(
        null=False, blank=True, max_length=20, choices=TASK_TYPE_CHOICES, default="TASK"
    )
    entities = models.ManyToManyField(Entity, blank=True, related_name="tasks")
    location = models.CharField(max_length=200, null=False, blank=True, default="")
    contact_name = models.CharField(max_length=200, null=False, blank=True, default="")
    contact_email = models.CharField(max_length=200, null=False, blank=True, default="")
    contact_no = PhoneNumberField(null=True, blank=True, unique=False)
    notes = models.CharField(max_length=200, null=False, blank=True, default="")

    hidden_tag = models.CharField(
        null=True, blank=True, max_length=20, choices=HIDDEN_TAG_CHOICES, default=""
    )

    tags = ArrayField(
        models.CharField(max_length=200, null=False, blank=False, choices=TAG_CHOICES),
        null=False,
        blank=True,
        default=list,
    )

    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="TaskMembership",
        through_fields=("task", "member"),
        related_name="tasks",
    )

    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True)

    routine = models.ForeignKey(
        Routine,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="tasks",
    )

    def __str__(self):
        return self.title


class FixedTask(Task):
    """FixedTask
    A fixed task must have one of the following options:
    - start_datetime, end_datetime
        We set the start and end datetime of the task, and optionally the timezones
    - start_date, end_date
        We just set the start and end dates of the task
    - date, duration
        We set the date of the task and the duration of the task
    """

    start_datetime = models.DateTimeField(null=True, blank=True)
    end_datetime = models.DateTimeField(null=True, blank=True)
    start_timezone = TimeZoneField(null=True, blank=True)
    end_timezone = TimeZoneField(null=True, blank=True)

    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    date = models.DateField(null=True, blank=True)
    duration = models.IntegerField(null=True, blank=True)


URGENCY_CHOICES = [
    ("LOW", "Low"),
    ("MEDIUM", "Medium"),
    ("HIGH", "High"),
]


class FlexibleTask(Task):
    """FlexibleTask"""

    earliest_action_date = models.DateField(null=True, blank=True)
    due_date = models.DateField(null=True, blank=True)
    duration = models.IntegerField(null=False, blank=False, default=30)
    urgency = models.CharField(
        null=True, blank=True, max_length=20, choices=URGENCY_CHOICES, default=None
    )


RecurrenceType = Literal[
    "DAILY",
    "WEEKDAILY",
    "WEEKLY",
    "MONTHLY",
    "YEARLY",
    "MONTH_WEEKLY",
    "YEAR_MONTH_WEEKLY",
    "MONTHLY_LAST_WEEK",
]
RecurrenceChoice = Tuple[RecurrenceType, str]
RecurrenceChoices = List[RecurrenceChoice]
RECURRENCE_CHOICES: RecurrenceChoices = [
    ("DAILY", "Daily"),
    ("WEEKDAILY", "Weekdaily"),
    ("WEEKLY", "Weekly"),
    ("MONTHLY", "Monthly"),
    ("MONTH_WEEKLY", "Month-Weekly"),
    ("YEARLY", "Yearly"),
    ("YEAR_MONTH_WEEKLY", "Year-Month-Weekly"),
    ("MONTHLY_LAST_WEEK", "Monthly-Last-Week"),
]


class Recurrence(models.Model):
    """We can assign recurrence to any type of task - for fixed tasks
    this will simply make them re-occur at the specified interval.
    For flexible tasks, each instance will be placed individually.

    NOTE - we index occurrences of a task based on the original task.
    E.g. if we have a weekly Recurrence object with a `task` property
    then the task set at the start and end times of this `task` property
    will have index `0`, the next one will have index `1`, etc.

    These indices are what we use to distinguish tasks and mark instances
    of a recurring task as complete or modify individual occurrences.

    This means that after creating a recurring task we cannot modify the
    recurrence or the base task itself without potentially causing strange
    and unintended consequences.
    """

    interval_length = models.IntegerField(
        blank=True,
        null=False,
        help_text="The number of periods between occurrences",
        default=1,
    )

    task = models.OneToOneField(
        Task,
        null=False,
        blank=False,
        related_name="recurrence",
        on_delete=models.CASCADE,
    )
    recurrence = models.CharField(
        null=False, blank=False, max_length=20, choices=RECURRENCE_CHOICES
    )

    earliest_occurrence = models.DateTimeField(
        null=True,
        blank=True,
        auto_now_add=False,
        help_text="""
            The earliest permitted occurrence of a task.
            Tasks will not be generated before this time.
        """,
    )

    latest_occurrence = models.DateTimeField(
        null=True,
        blank=True,
        auto_now_add=False,
        help_text="""
            The latest permitted occurrence of a task.
            Tasks will not be generated after this time.
        """,
    )


class RecurrentTaskOverwrite(models.Model):
    """To overwrite a specific occurrence of a task we create an instance
    of RecurrentTaskOverwrite which defines:

    - The task with which to replace the occurrence
    - The recurrence for which to replace the task
    - The recurrence_index to specify the specific instance to replace
    """

    task = models.OneToOneField(
        Task,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="recurrent_task_overwrite",
        help_text="If null then just deletes the occurrence",
    )
    recurrence = models.ForeignKey(
        Recurrence,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="recurrent_task_overwrite",
    )
    recurrence_index = models.IntegerField(null=False, blank=False)


class TaskMembership(models.Model):
    """TaskMembership"""

    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=False, blank=False)
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=False, blank=False
    )


class TaskViewership(models.Model):
    """TaskViewership"""

    task = models.ForeignKey(Task, on_delete=models.CASCADE, null=False, blank=False)
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=False, blank=False
    )


class TaskReminder(models.Model):
    """We can assign recurring reminders to any type of task."""

    task = models.ForeignKey(
        Task,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="reminders",
    )
    timedelta = models.DurationField(
        blank=False,
        null=False,
        help_text="The time before a task at which the action needs to be taken",
        default=timedelta(days=1),
    )

    def __str__(self):
        return f"REMINDER - {self.task.title}"


class TaskAction(models.Model):
    """We can assign actions to any type of task - these define times at
    which actions relating to a task need to be completed."""

    task = models.ForeignKey(
        Task,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="actions",
    )
    action_timedelta = models.DurationField(
        blank=False,
        null=False,
        help_text="The time before a task at which the action needs to be taken",
        default=timedelta(days=1),
    )

    def __str__(self):
        try:
            task = self.task
            return f"ACTION - {task.title}"
        except Exception as exc:
            return "ACTION"

        return "ACTION"


class TaskActionCompletionForm(models.Model):
    """TaskActionCompletionForm"""

    action = models.ForeignKey(
        TaskAction,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="completion_forms",
    )

    completion_datetime = models.DateTimeField(
        null=False, blank=False, auto_now_add=True
    )

    recurrence_index = models.IntegerField(null=True, blank=True)

    ignore = models.BooleanField(null=False, blank=True, default=False)
    complete = models.BooleanField(null=False, blank=True, default=True)
