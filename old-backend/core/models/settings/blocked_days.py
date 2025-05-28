from django.conf import settings
from django.db import models


from core.utils.categories import Categories


class BlockedCategory(models.Model):
    """A model for determining the blocked categories"""
    category = models.IntegerField(choices=[(e.value, e.name) for e in Categories], null=False, blank=False)


class BirthdayBlockedCategory(BlockedCategory):
    """A model for determining the blocked categories
    for task placement on birthdays"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="birthday_blocked_categories",
        null=False,
        blank=True,
    )


class FamilyBirthdayBlockedCategory(BlockedCategory):
    """A model for determining the blocked days config
    for task placement on family birthdays"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="family_birthday_blocked_categories",
        null=False,
        blank=True,
    )


class NationalHolidaysBlockedCategory(BlockedCategory):
    """A model for determining the blocked days config
    for task placement on national holidays (Holidays I Celebrate)"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="national_holidays_blocked_categories",
        null=False,
        blank=True,
    )


class TermTimeBlockedCategory(BlockedCategory):
    """A model for determining the blocked days config
    for task placement during term time"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="term_time_blocked_categories",
        null=False,
        blank=True,
    )


class TripBlockedCategory(BlockedCategory):
    """A model for determining the blocked days config
    for task placement during trips"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="trip_blocked_categories",
        null=False,
        blank=True,
    )


class DaysOffBlockedCategory(BlockedCategory):
    """A model for determining the blocked days config
    for task placement during days off"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="days_off_blocked_categories",
        null=False,
        blank=True,
    )
