"""Home models"""

from django.db import models

from core.utils.categories import Categories

from .base import Entity


class HomeEntity(Entity):
    """HomeEntity"""

    def save(self, **kwargs):
        self.category = Categories.HOME.value
        return super().save(**kwargs)

    class Meta:
        abstract = True


RESIDENCE_TYPE_CHOICES = [
    ("RESIDENCE", "Residence"),
    ("SECOND_HOME", "Second Home"),
    ("INVESTMENT", "Investment"),
]

HOUSE_TYPE_CHOICES = [
    ("HOUSE", "House"),
    ("APARTMENT", "Apartment"),
]


class Home(HomeEntity):
    """Home"""

    address = models.CharField(null=True, blank=True, max_length=200)
    residence_type = models.CharField(
        null=True, blank=True, choices=RESIDENCE_TYPE_CHOICES, max_length=30
    )
    house_type = models.CharField(
        null=True, blank=True, choices=HOUSE_TYPE_CHOICES, max_length=30
    )
    has_outside_area = models.BooleanField(null=False, blank=False, default=False)
