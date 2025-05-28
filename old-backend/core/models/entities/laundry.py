"""Laundry models"""

from core.utils.categories import Categories

from .base import Entity


class LaundryEntity(Entity):
    """LaundryEntity"""

    def save(self, **kwargs):
        self.category = Categories.LAUNDRY.value
        return super().save(**kwargs)

    class Meta:
        abstract = True


class LaundryPlan(LaundryEntity):
    """LaundryPlan"""
