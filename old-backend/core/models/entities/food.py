"""Food models"""

from core.utils.categories import Categories

from .base import Entity


class FoodEntity(Entity):
    """FoodEntity"""

    def save(self, **kwargs):
        self.category = Categories.FOOD.value
        return super().save(**kwargs)

    class Meta:
        abstract = True


class FoodPlan(FoodEntity):
    """FoodPlan"""
