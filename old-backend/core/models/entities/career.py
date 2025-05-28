"""Models for career entities"""
from django.db import models

from core.utils.categories import Categories

from .base import Entity


class CareerEntity(Entity):
    """CareerEntity"""

    def save(self, **kwargs):
        self.category = Categories.CAREER.value
        return super().save(**kwargs)

    class Meta:
        abstract = True


class DaysOff(CareerEntity):
    """DaysOff"""

    start_date: models.DateField = models.DateField(null=False, blank=False)
    end_date: models.DateField = models.DateField(null=False, blank=False)
    description: models.CharField = models.CharField(
        null=False, blank=True, max_length=1000
    )


class Employee(CareerEntity):
    """Employee"""


class CareerGoal(CareerEntity):
    """CareerGoal"""
