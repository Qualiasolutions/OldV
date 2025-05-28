"""user models"""

import logging
from typing import List, Optional

from django.apps import apps
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.query import QuerySet
from imagekit.models import ImageSpecField  # type: ignore
from imagekit.processors import ResizeToFit, Transpose  # type: ignore
from phonenumber_field.modelfields import PhoneNumberField  # type: ignore

from core.utils.presigned_urls import get_or_create_presigned_url
from subscriptions.models import Subscription

logger = logging.getLogger(__name__)


def family_image_upload_location(instance, filename):
    """family_image_upload_location"""
    ext = filename.split(".")[-1]
    return f"family/images/{instance.id}.{ext}"


def user_profile_image_upload_location(instance, filename):
    """user_profile_image_upload_location"""
    ext = filename.split(".")[-1]
    return f"user/profile_images/{instance.id}.{ext}"


class Family(models.Model):
    """Family"""

    users: Optional[List["User"]]

    class Meta:
        verbose_name_plural = "families"

    image = models.FileField(
        null=True, blank=True, upload_to=family_image_upload_location
    )

    # Downsized images - Transpose ensures correct rotation
    image_200_200 = ImageSpecField(
        source="image",
        processors=[Transpose(), ResizeToFit(200, 200)],
        format="JPEG",
        options={"quality": 60},
    )

    def presigned_image_url(self):
        """presigned_image_url"""
        return get_or_create_presigned_url(
            self, "image_200_200", f"family-{self.id}-{self.image.name}-image-200-200"
        )


class User(AbstractUser):
    """User"""

    subscriptions: "QuerySet[Subscription]"

    family = models.ForeignKey(
        Family, on_delete=models.CASCADE, null=True, blank=True, related_name="users"
    )
    phone_number = PhoneNumberField(null=True, blank=True, unique=True)
    email = models.EmailField(null=True, blank=True, unique=True)  # type: ignore
    dob = models.DateField(null=True, blank=True)
    member_colour = models.CharField(null=False, blank=True, max_length=10, default="")
    has_done_setup = models.BooleanField(null=False, blank=False, default=False)
    profile_image = models.FileField(
        null=True, blank=True, upload_to=user_profile_image_upload_location
    )

    friends = models.ManyToManyField(
        "User",
        through="Friendship",
        through_fields=("creator", "friend"),
        symmetrical=True,
    )

    # Downsized images - Transpose ensures correct rotation
    profile_image_200_200 = ImageSpecField(
        source="profile_image",
        processors=[Transpose(), ResizeToFit(200, 200)],
        format="JPEG",
        options={"quality": 60},
    )

    def presigned_profile_image_url(self):
        """presigned_profile_image_url"""
        return get_or_create_presigned_url(
            self,
            "profile_image_200_200",
            f"user-{self.id}-{self.profile_image.name}-profile-image-200-200",
        )

    def save(self, *args, **kwargs):
        """Ensure that dependent models are updated"""

        super().save(*args, **kwargs)

        if self.dob and self.family:
            # We want to ensure that all family birthdays
            # are synnced (e.g. if we add a new family member
            # then we need to ensure that the new member is
            # assigned to all birthdays)
            family_members = self.family.users.all()

            for user in family_members:
                tasks = apps.get_model("core", "UserBirthdayTask").objects.filter(
                    user=user
                )

                if tasks.exists():
                    for task in tasks:
                        task.save()

                elif user.first_name:
                    apps.get_model("core", "UserBirthdayTask").objects.create(
                        user=user, title=f"{user.first_name}'s Birthday", type="USER_BIRTHDAY"
                    )

        return


class CategorySetupCompletion(models.Model):
    """Mark whether a user has completed a category setup"""

    category = models.IntegerField(null=False, blank=True)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="category_completions",
    )


class ReferencesSetupCompletion(models.Model):
    """Mark whether a user has completed references setup"""

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="reference_completions",
    )


class EntityTypeSetupCompletion(models.Model):
    """Mark whether a user has completed a specific entity type setup"""

    entity_type = models.CharField(max_length=127, null=False, blank=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="entity_type_completions",
    )


class TagSetupCompletion(models.Model):
    """Mark whether a user has completed a specific tag setup"""

    tag_name = models.CharField(max_length=127, null=False, blank=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="tag_completions",
    )


class LinkListSetupCompletion(models.Model):
    """Mark whether a user has completed a specific link list setup"""

    list_name = models.CharField(max_length=127, null=False, blank=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="link_list_completions",
    )


class Friendship(models.Model):
    """Friendship"""

    creator = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="created_friendships",
    )
    friend = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="accepted_friendships",
    )
    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True)

    class Meta:
        unique_together = [["creator", "friend"]]

    def save(self, *args, **kwargs):
        friend = self.friend
        creator = self.creator
        creator.friends.add(friend)

        friendship = Friendship.objects.get(friend=friend, creator=creator)
        self.pk = friendship.pk
        self.created_at = friendship.created_at
        return

    def delete(self, *args, **kwargs):
        friend = self.friend
        creator = self.creator
        creator.friends.remove(friend)

        UserInvite.objects.filter(
            invitee=friend, phone_number=creator.phone_number
        ).delete()

        UserInvite.objects.filter(
            invitee=creator, phone_number=friend.phone_number
        ).delete()

        return


class UserInvite(models.Model):
    """A user may arbitrarily create UserInvite objects
    in order to invite friends or family members to Vuet.

    The UserInvite object stores the attributes with
    which a new User is created when they accept the
    invite.
    """

    family = models.ForeignKey(
        Family,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="user_invites",
        help_text=(
            "The family to which a user has been invited. "
            "If `null` then it is a normal friend request."
        ),
    )
    invitee = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="user_invites",
    )
    first_name = models.CharField(max_length=50, null=False, blank=True, default="")
    last_name = models.CharField(max_length=50, null=False, blank=True, default="")
    phone_number = PhoneNumberField(null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    dob = models.DateField(null=True, blank=True)
    member_colour = models.CharField(null=False, blank=True, max_length=10, default="")
    rejected = models.BooleanField(null=False, blank=False, default=False)
    accepted = models.BooleanField(null=False, blank=False, default=False)


class LastActivityView(models.Model):
    """LastActivityView
    Record the last time that a use viewed the recent activity feed
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="last_activity",
    )

    timestamp = models.DateTimeField(auto_now=True)
