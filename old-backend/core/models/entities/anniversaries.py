"""Anniversary models"""
from django.db import models

from core.models.entities.lists import List
from core.utils.categories import Categories

from .base import Entity


class Anniversary(Entity):
    """Anniversary"""

    start_date = models.DateField(null=True, blank=True)
    known_year = models.BooleanField(null=False, blank=False, default=False)

    def save(self, **kwargs):
        self.category = Categories.SOCIAL_INTERESTS.value
        super().save(**kwargs)


class Birthday(Anniversary):
    """Birthday"""

    first_name = models.CharField(null=False, blank=False, max_length=100, default="")
    last_name = models.CharField(null=False, blank=False, max_length=100, default="")

    def save(self, **kwargs):
        created = not self.pk
        super().save(**kwargs)
        if created:
            gift_list = List.objects.create(
                name="Gift", owner=self.owner, category=self.category, parent=self
            )
            gift_list.members.add(self.owner)

        return None
