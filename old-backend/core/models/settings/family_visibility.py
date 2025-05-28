"""Models for what family can see"""

from django.conf import settings
from django.db import models

from core.utils.categories import Categories


class FamilyCategoryViewPermission(models.Model):
    """Determined whether family members can see appointments
    for the specified category - if an object exists then the
    family has view permissions for appointments in that category"""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="family_category_view_permissions",
        null=False,
        blank=True,
    )
    category = models.IntegerField(choices=[(e.value, e.name) for e in Categories])
