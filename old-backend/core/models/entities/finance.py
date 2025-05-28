from core.utils.categories import Categories
from .base import Entity


class FinanceEntity(Entity):
    def save(self, **kwargs):
        self.category = Categories.FINANCE.value
        return super().save(**kwargs)

    class Meta:
        abstract = True


class Finance(FinanceEntity):
    pass
