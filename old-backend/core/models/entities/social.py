"""Social entities"""
import logging

from django.db import models
from phonenumber_field.modelfields import PhoneNumberField  # type: ignore

from core.models.users.user_models import User
from core.utils.categories import Categories

from .base import Entity

logger = logging.getLogger(__name__)


class SocialEntity(Entity):
    """SocialEntity"""

    def save(self, *args, **kwargs):
        self.category = Categories.SOCIAL_INTERESTS.value
        return super().save(*args, **kwargs)

    class Meta:
        abstract = True


class EventSubentity(SocialEntity):
    """EventSubentity"""


class AutoSubentity(SocialEntity):
    """An entity that auto-creates social subentities"""

    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        created = not self.pk
        res = super().save(*args, **kwargs)
        if created:
            auto_subentities = [
                {"name": "Food / Cake / Candles", "subtype": "food"},
                {"name": "Activities / Venue", "subtype": "venue"},
                {"name": "Party Favours / Games", "subtype": "party_favours"},
                {"name": "Gifts / Wrapping", "subtype": "gifts"},
                {"name": "Music", "subtype": "music"},
                {"name": "Decorations", "subtype": "decorations"},
                # {"name": "Guest list", "subtype": "guest_list"},
            ]
            for subentity in auto_subentities:
                new_subentity = EventSubentity.objects.create(
                    name=subentity["name"],
                    category=self.category,
                    parent=self,
                    subtype=subentity["subtype"],
                    hidden=True,
                )
                new_subentity.members.add(self.owner)

        return res


class Event(AutoSubentity):
    """Event"""

    start_datetime = models.DateTimeField(null=False, blank=False)
    end_datetime = models.DateTimeField(null=False, blank=False)


class Hobby(SocialEntity):
    """Hobby"""


class Holiday(SocialEntity):
    """Holiday"""

    string_id = models.CharField(max_length=100, null=False, blank=True)
    country_code = models.CharField(max_length=3, null=False, blank=True)
    start_date = models.DateField(null=False, blank=False)
    end_date = models.DateField(null=False, blank=False)
    custom = models.BooleanField(default=False)


class HolidayPlan(AutoSubentity):
    """HolidayPlan"""


class SocialPlan(SocialEntity):
    """SocialPlan"""


class SocialMedia(SocialEntity):
    """SocialMedia"""


class AnniversaryPlan(AutoSubentity):
    """AnniversaryPlan"""


class GuestListInvite(models.Model):
    """GuestListInvite

    AutoSubentity social entities include guestlists. Members
    of the entity can add users to the guest list and send out
    invites to the members of the guestlist.

    The model should be saved with the `user` attribute if a
    Vuet user already exists, otherwise it can be saved with
    a phone number or email and the invitee should be invited
    to sign up to Vuet in order to receive the event invitation.
    """

    entity = models.ForeignKey(
        Entity,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="guest_list_invites",
        help_text="""Should be an AutoSubentity entity""",
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="guest_list_invites",
        default=None,
    )
    name = models.CharField(null=False, blank=True, max_length=255, default="")
    phone_number = PhoneNumberField(null=True, blank=True, default=None)
    email = models.CharField(null=True, blank=True, max_length=100, default=None)
    accepted = models.BooleanField(null=False, blank=True, default=False)
    rejected = models.BooleanField(null=False, blank=True, default=False)
    maybe = models.BooleanField(null=False, blank=True, default=False)
    sent = models.BooleanField(null=False, blank=True, default=False)

    class Meta:
        unique_together = (
            ("user", "entity"),
            ("phone_number", "entity"),
            ("email", "entity"),
        )
