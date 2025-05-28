"""sync_icals"""

from external_calendars.models import ICalIntegration


def sync_icals():
    """sync_icals"""
    ical_integrations = ICalIntegration.objects.all()
    for ical in ical_integrations:
        ical.sync_ical()
