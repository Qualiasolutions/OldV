"""Base entities"""

import uuid
from typing import List, Literal, Tuple

from django.conf import settings
from django.contrib.postgres.fields import ArrayField
from django.db import models
from imagekit.models import ImageSpecField  # type: ignore
from imagekit.processors import ResizeToFit, Transpose  # type: ignore
from polymorphic.models import PolymorphicModel  # type: ignore

from core.models.categories.categories import ProfessionalCategory
from core.models.users.user_models import User
from core.utils.presigned_urls import get_or_create_presigned_url
from core.utils.tags import TAG_CHOICES


def entity_image_upload_location(instance, filename):
    """entity_image_upload_location"""
    ext = filename.split(".")[-1]
    return f"entities/images/{instance.uuid}.{ext}"


class Entity(PolymorphicModel):
    """Entity"""

    uuid = models.UUIDField(primary_key=False, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=200)
    notes = models.CharField(null=False, blank=True, max_length=1000, default="")
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_entities",
        null=True,
        blank=True,
    )
    category = models.IntegerField(null=False, blank=True)
    hidden = models.BooleanField(null=False, blank=True, default=False)
    parent = models.ForeignKey(
        "Entity",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="child_entities",
    )
    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        through="EntityMembership",
        through_fields=("entity", "member"),
        related_name="entities",
    )
    subtype = models.CharField(max_length=200, null=False, blank=True)

    image = models.FileField(
        null=True, blank=True, upload_to=entity_image_upload_location
    )

    # Downsized images - Transpose ensures correct rotation
    image_200_200 = ImageSpecField(
        source="image",
        processors=[Transpose(), ResizeToFit(200, 200)],
        format="JPEG",
        options={"quality": 60},
    )

    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True)

    def presigned_image_url(self):
        """presigned_image_url"""
        return get_or_create_presigned_url(
            self, "image_200_200", f"entity-{self.id}-{self.image.name}-image-200-200"
        )

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        created = not self.pk

        if created and self.parent:
            if not self.category:
                self.category = self.parent.category

        res = super().save(*args, **kwargs)
        return res


class ProfessionalEntity(Entity):
    """ProfessionalEntity"""

    def save(self, *args, **kwargs):
        self.category = -1  # Professional entities just set category to -1
        return super().save(*args, **kwargs)


class ProfessionalEntityCategoryMapping(models.Model):
    """ProfessionalEntityCategoryMapping

    This is the mapping that determines for each entity / user
    combination, which of the user's categories the entity
    should fall into.
    """

    entity = models.ForeignKey(
        ProfessionalEntity, null=False, blank=False, on_delete=models.CASCADE
    )
    category = models.ForeignKey(
        ProfessionalCategory, null=False, blank=False, on_delete=models.CASCADE
    )
    user = models.ForeignKey(User, null=False, blank=False, on_delete=models.CASCADE)

    class Meta:
        unique_together = (("user", "entity"),)


class EntityMembership(models.Model):
    """EntityMembership"""

    entity = models.ForeignKey(
        Entity, on_delete=models.CASCADE, null=False, blank=False
    )
    member = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=False, blank=False
    )


class ReferenceGroup(models.Model):
    """A group of references - every reference should be assigned to
    a group.

    Tagging will work similarly to tagging on tasks."""

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_reference_groups",
        null=False,
        blank=True,
    )
    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True)
    entities = models.ManyToManyField(
        Entity, blank=True, related_name="reference_groups"
    )

    tags = ArrayField(
        models.CharField(max_length=200, null=False, blank=False, choices=TAG_CHOICES),
        null=False,
        blank=True,
        default=list,
    )

    name = models.CharField(max_length=127, null=False, blank=False)


ReferenceType = Literal[
    "NAME",
    "ACCOUNT_NUMBER",
    "USERNAME",
    "PASSWORD",
    "WEBSITE",
    "NOTE",
    "ADDRESS",
    "PHONE_NUMBER",
    "DATE",
    "OTHER",
]
ReferenceTypeChoice = Tuple[ReferenceType, str]
ReferenceTypeChoices = List[ReferenceTypeChoice]

REFERENCE_TYPE_CHOICES: ReferenceTypeChoices = [
    ("NAME", "Name"),
    ("ACCOUNT_NUMBER", "Account number"),
    ("USERNAME", "Username"),
    ("PASSWORD", "Password"),
    ("WEBSITE", "Website"),
    ("NOTE", "Note"),
    ("ADDRESS", "Address"),
    ("PHONE_NUMBER", "Phone number"),
    ("DATE", "Date"),
    ("OTHER", "Other"),
]


class Reference(models.Model):
    """A Reference field for storing key-value pair information about entities."""

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_references",
        null=False,
        blank=True,
    )
    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True)
    name = models.CharField(max_length=127, null=False, blank=False)
    value = models.CharField(max_length=255, null=False, blank=False)
    type = models.CharField(
        max_length=127,
        null=False,
        blank=False,
        default="",
        choices=REFERENCE_TYPE_CHOICES,
    )
    group = models.ForeignKey(
        ReferenceGroup,
        on_delete=models.CASCADE,
        related_name="references",
        null=True,
        blank=False,
    )
