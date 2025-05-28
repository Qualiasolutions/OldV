import logging
from typing import List

from django.db.models import Q
from django.utils import timezone

from core.models.tasks.base import FixedTask
from notifications.utils.send_notification import send_push_message_if_valid
from vuet.settings import REMINDER_JOB_FREQUENCY

logger = logging.getLogger(__name__)


def send_due_reminders():
    """Sends all due reminders"""
    logger.info("SENDING DUE REMINDERS")

    now = timezone.now()
    all_potential_one_off_tasks_to_remind: List[FixedTask] = list(
        FixedTask.objects.all()
        .filter(
            Q(
                Q(recurrence__isnull=True)
                & (
                    Q(start_datetime__gte=now)
                    | Q(start_date__gte=now)
                    | Q(date__gte=now)
                )
            )
        )
        .prefetch_related("reminders")
    )

    for task in all_potential_one_off_tasks_to_remind:
        reminders = task.reminders.all()
        for reminder in reminders:
            if task and task.start_datetime:
                reminder_due_time = task.start_datetime - reminder.timedelta

                reminder_offset = now - reminder_due_time
                if (
                    reminder_offset.seconds >= 0
                ) and reminder_offset.seconds < REMINDER_JOB_FREQUENCY:
                    for member in task.members.all():
                        push_tokens = member.push_tokens.all()
                        for push_token in push_tokens:
                            send_push_message_if_valid(
                                push_token,
                                f"REMINDER - {task.title} {task.start_datetime.strftime('%H:%M GMT on %d/%m/%Y')}",
                            )
