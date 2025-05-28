"External calendar models"

import logging

import icalendar  # type: ignore
import requests
from dateutil.relativedelta import relativedelta
from django.db import models

from core.models.tasks.base import FixedTask, Recurrence
from core.models.users.user_models import User

logger = logging.getLogger(__name__)


FREQUENCY_DELTA_MAPPINGS = {
    "DAILY": relativedelta(days=1),
    "WEEKLY": relativedelta(weeks=1),
    "MONTHLY": relativedelta(months=1),
    "YEARLY": relativedelta(years=1),
}


ICAL_TYPE_CHOICES = [
    ("UNKNOWN", "Unknown"),
    ("GOOGLE", "Google"),
    ("ICLOUD", "ICloud"),
    ("OUTLOOK", "Outlook"),
]

ICAL_SHARE_CHOICES = [
    ("OFF", "Off"),
    ("BUSY", "Busy"),
    ("FULL", "Full"),
]


class ICalIntegration(models.Model):
    """ICalIntegration"""

    ical_events: "models.QuerySet[ICalEvent]"

    ical_name = models.CharField(blank=False, null=False, default="", max_length=255)
    ical_url = models.CharField(blank=False, null=False, default="", max_length=255)
    ical_type = models.CharField(
        blank=False,
        null=False,
        default="UNKNOWN",
        max_length=63,
        choices=ICAL_TYPE_CHOICES,
    )
    share_type = models.CharField(
        blank=False,
        null=False,
        default="OFF",
        max_length=63,
        choices=ICAL_SHARE_CHOICES,
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="ical_integrations",
        null=False,
        blank=True,
    )

    def sync_ical(self):
        """sync_ical"""
        if self.ical_url:
            res = requests.get(self.ical_url, timeout=60)
            calendar = icalendar.Calendar.from_ical(res.content)

            self.ical_events.all().delete()
            for event in calendar.walk("VEVENT"):
                start_dt = event.get("DTSTART").dt
                end_dt = event.get("DTEND").dt
                ical_event = ICalEvent.objects.create(
                    title=event.get("SUMMARY"),
                    start_datetime=start_dt,
                    end_datetime=end_dt,
                    ical_integration=self,
                    type="ICAL_EVENT",
                )
                ical_event.members.set([self.user])

                rrule = event.get("RRULE")
                if rrule:
                    for i, freq in enumerate(rrule.get("FREQ")):
                        until = (
                            rrule.get("UNTIL")[i]
                            if rrule.get("UNTIL") and (len(rrule.get("UNTIL")) > i)
                            else None
                        )
                        count = (
                            rrule.get("COUNT")[i]
                            if rrule.get("COUNT") and (len(rrule.get("COUNT")) > i)
                            else None
                        )
                        interval = (
                            rrule.get("INTERVAL")[i]
                            if rrule.get("INTERVAL")
                            and (len(rrule.get("INTERVAL")) > i)
                            else 1
                        )

                        if count and freq and not until:
                            until = end_dt + (FREQUENCY_DELTA_MAPPINGS[freq] * count)

                        Recurrence.objects.create(
                            task=ical_event,
                            interval_length=interval,
                            recurrence=freq,
                            latest_occurrence=until,
                        )


class ICalEvent(FixedTask, models.Model):
    """ICalEvent"""

    ical_integration = models.ForeignKey(
        ICalIntegration,
        on_delete=models.CASCADE,
        related_name="ical_events",
        null=False,
        blank=False,
    )
