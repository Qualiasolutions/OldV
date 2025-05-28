"""Travel-specific tasks"""

from django.db import models

from core.models.tasks.base import FixedTask


class TransportTask(FixedTask):
    """TransportTask"""

    carrier: models.CharField = models.CharField(null=False, blank=True, max_length=100)
    booking_number: models.CharField = models.CharField(
        null=False, blank=True, max_length=100
    )
    flight_number: models.CharField = models.CharField(
        null=False, blank=True, max_length=100
    )
    start_location: models.CharField = models.CharField(
        null=False, blank=False, max_length=100
    )
    end_location: models.CharField = models.CharField(
        null=False, blank=False, max_length=100
    )


class AccommodationTask(FixedTask):
    """AccommodationTask"""

    accommodation_name: models.CharField = models.CharField(
        null=False, blank=True, max_length=100
    )
