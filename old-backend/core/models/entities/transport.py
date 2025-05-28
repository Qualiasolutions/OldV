"""Transport models"""
from django.db import models

from core.utils.categories import Categories

from .base import Entity

CAR_TYPE_CHOICES = [("CAR", "Car"), ("MOTORBIKE", "Motorbike")]

BOAT_TYPE_CHOICES = [("BOAT", "Boat"), ("OTHER", "Other")]


class TransportEntity(Entity):
    """TransportEntity"""

    def save(self, **kwargs):
        self.category = Categories.TRANSPORT.value
        return super().save(**kwargs)

    class Meta:
        abstract = True


class Vehicle(TransportEntity):
    """Vehicle"""

    make = models.CharField(null=False, blank=False, max_length=100)
    model = models.CharField(null=False, blank=True, max_length=100, default="")
    registration = models.CharField(null=False, blank=True, max_length=100, default="")
    date_registered = models.DateField(null=True, blank=True)
    service_due_date = models.DateField(null=True, blank=True)
    insurance_due_date = models.DateField(null=True, blank=True)

    class Meta:
        abstract = True


class Car(Vehicle):
    """Car"""

    vehicle_type = models.CharField(
        null=True, blank=True, choices=CAR_TYPE_CHOICES, max_length=30
    )


class Boat(Vehicle):
    """Boat"""

    vehicle_type = models.CharField(
        null=True, blank=True, choices=BOAT_TYPE_CHOICES, max_length=30
    )


class PublicTransport(TransportEntity):
    """PublicTransport"""

    pass
