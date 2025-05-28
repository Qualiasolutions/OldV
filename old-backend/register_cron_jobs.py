"""Register cron jobs for scheduled tasks"""

import logging
import os
from datetime import datetime

import pycron  # type: ignore
from asgiref.sync import sync_to_async
from django.core.wsgi import get_wsgi_application

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "vuet.settings")
application = get_wsgi_application()

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)


if __name__ == "__main__":
    from external_calendars.utils.sync_icals import sync_icals
    from notifications.utils.send_reminders import send_due_reminders

    cron_enabled = os.environ.get("CRON_ENABLED", "FALSE").lower() == "true"

    if cron_enabled:
        logger.info("Registering Cron Jobs")

        @pycron.cron(
            "*/5 * * * *"
        )  # Every 5 minutes - should match the frequency in settings
        @sync_to_async
        def send_reminders(timestamp: datetime):
            """send_reminders"""
            send_due_reminders()

        @pycron.cron("*/30 * * * *")  # Every half hour
        @sync_to_async
        def sync_icalendars(timestamp: datetime):
            """sync_icalendars"""
            sync_icals()

        logger.info("Successfully Registered Cron Jobs")

        pycron.start()

    else:
        logger.info("Cron jobs are not enabled - not registering cron jobs")
