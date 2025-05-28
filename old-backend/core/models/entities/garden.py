"""Garden models"""

from core.utils.categories import Categories

from .base import Entity


class GardenEntity(Entity):
    """GardenEntity"""

    def save(self, **kwargs):
        self.category = Categories.GARDEN.value
        return super().save(**kwargs)

    class Meta:
        abstract = True


class Garden(GardenEntity):
    """Home"""
