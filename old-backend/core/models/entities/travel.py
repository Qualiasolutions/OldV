from django.db import models

from core.utils.categories import Categories

from .base import Entity


class TravelEntity(Entity):
    """TravelEntity"""

    def save(self, **kwargs):
        self.category = Categories.TRAVEL.value
        return super().save(**kwargs)

    class Meta:
        abstract = True


class Trip(TravelEntity):
    """Trip"""

    destination: models.CharField = models.CharField(
        null=False, blank=True, max_length=100
    )
    start_date: models.DateField = models.DateField(null=False, blank=False)
    end_date: models.DateField = models.DateField(null=False, blank=False)


class TravelPlan(TravelEntity):
    """TravelPlan"""
