"""Health and Beauty entities"""
from core.utils.categories import Categories

from .base import Entity


class HealthBeautyEntity(Entity):
    """HealthBeautyEntity"""

    def save(self, **kwargs):
        self.category = Categories.HEALTH_BEAUTY.value
        return super().save(**kwargs)

    class Meta:
        abstract = True


class HealthBeauty(HealthBeautyEntity):
    """HealthBeauty"""


class Patient(HealthBeautyEntity):
    """Patient"""


class Appointment(HealthBeautyEntity):
    """Appointment"""


class HealthGoal(HealthBeautyEntity):
    """HealthGoal"""
