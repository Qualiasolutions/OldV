"""Category models"""
from django.db import models

from core.models.users.user_models import User


class ProfessionalCategory(models.Model):
    """ProfessionalCategory"""

    name = models.CharField(default="", null=False, blank=False, max_length=127)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="professional_categories",
        null=False,
        blank=False,
    )
