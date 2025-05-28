"""List models"""

from django.db import models
from imagekit.models import ImageSpecField  # type: ignore
from imagekit.processors import ResizeToFit, Transpose  # type: ignore
from phonenumber_field.modelfields import PhoneNumberField  # type: ignore

from core.models.entities.base import Entity
from core.models.users.user_models import User
from core.utils.presigned_urls import get_or_create_presigned_url


def list_image_upload_location(instance, filename):
    """list_image_upload_location"""
    ext = filename.split(".")[-1]
    return f"lists/images/{instance.list.id}/{instance.id}.{ext}"


class List(Entity):
    """List"""

    pass


class ListEntry(models.Model):
    """ListEntry"""

    list = models.ForeignKey(
        List,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="list_entries",
    )
    title = models.CharField(max_length=200, blank=True, default="")
    selected = models.BooleanField(default=False)
    image = models.FileField(
        null=True, blank=True, upload_to=list_image_upload_location
    )
    notes = models.CharField(max_length=2000, blank=True, default="")
    phone_number = PhoneNumberField(null=True, blank=True, unique=False)

    # Downsized images - Transpose ensures correct rotation
    image_200_200 = ImageSpecField(
        source="image",
        processors=[Transpose(), ResizeToFit(200, 200)],
        format="JPEG",
        options={"quality": 60},
    )

    # Downsized images - Transpose ensures correct rotation
    image_800_800 = ImageSpecField(
        source="image",
        processors=[Transpose(), ResizeToFit(800, 800)],
        format="JPEG",
        options={"quality": 60},
    )

    class Meta:
        verbose_name_plural = "List Entries"

    def presigned_image_url(self):
        """presigned_image_url"""
        return get_or_create_presigned_url(
            self,
            "image_200_200",
            f"list-entry-{self.id}-{self.image.name}-image-200-200",
        )

    def presigned_image_url_large(self):
        """presigned_image_url_large"""
        return get_or_create_presigned_url(
            self,
            "image_800_800",
            f"list-entry-{self.id}-{self.image.name}-image-800-800",
        )


class PlanningList(models.Model):
    """PlanningList"""

    name = models.CharField(max_length=200)
    category = models.IntegerField(null=False, blank=False)
    members = models.ManyToManyField(
        User,
        related_name="planning_lists",
    )
    is_template = models.BooleanField(blank=False, null=False, default=False)


class PlanningSublist(models.Model):
    """PlanningSublist"""

    list = models.ForeignKey(
        PlanningList,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="sublists",
    )
    title = models.CharField(max_length=200, blank=True, default="")


class PlanningListItem(models.Model):
    """PlanningListItem"""

    sublist = models.ForeignKey(
        PlanningSublist,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="items",
    )
    title = models.CharField(max_length=200, blank=True, default="")
    checked = models.BooleanField(blank=True, null=False, default=False)


class ShoppingList(models.Model):
    """ShoppingList"""

    name = models.CharField(max_length=200)
    members = models.ManyToManyField(
        User,
        related_name="shopping_lists",
    )


class ShoppingListStore(models.Model):
    """ShoppingListStore"""

    name = models.CharField(max_length=200, blank=True, default="")
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="shopping_list_stores",
        null=False,
        blank=True,
    )


class ShoppingListItem(models.Model):
    """ShoppingListItem"""

    list = models.ForeignKey(
        ShoppingList,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="items",
    )
    store = models.ForeignKey(
        ShoppingListStore,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="items",
    )
    title = models.CharField(max_length=200, blank=True, default="")
    checked = models.BooleanField(blank=True, null=False, default=False)


class ShoppingListDelegation(models.Model):
    """ShoppingListDelegation
    Model for delegating a shopping list for a specific store to
    another user
    """

    list = models.ForeignKey(
        ShoppingList,
        null=False,
        blank=False,
        on_delete=models.CASCADE,
        related_name="delegations",
    )
    store = models.ForeignKey(
        ShoppingListStore,
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="delegations",
    )
    delegator = models.ForeignKey(
        User,
        blank=False,
        null=False,
        on_delete=models.CASCADE,
        related_name="sent_delegations",
    )
    delegatee = models.ForeignKey(
        User,
        blank=False,
        null=False,
        on_delete=models.CASCADE,
        related_name="received_delegations",
    )
