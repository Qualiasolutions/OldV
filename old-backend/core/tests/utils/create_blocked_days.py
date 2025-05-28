from typing import Any

from core.models.entities.career import DaysOff
from core.models.entities.education import School, SchoolTerm, SchoolYear
from core.models.entities.travel import Trip
from core.models.settings.blocked_days import (
    BirthdayBlockedCategory,
    DaysOffBlockedCategory,
    FamilyBirthdayBlockedCategory,
    NationalHolidaysBlockedCategory,
    TermTimeBlockedCategory,
    TripBlockedCategory,
)
from core.models.tasks.holidays import HolidayTask
from core.models.users.user_models import User


def create_blocked_days(blocked_days_conf: Any, user: User):
    """Create blocked day entities for the user provided"""
    if blocked_days_conf.get("birthdays"):
        BirthdayBlockedCategory.objects.create(
            user=user, category=blocked_days_conf.get("birthdays")["category"]
        )
        user.dob = blocked_days_conf.get("birthdays")["date"]
        user.save()

    if blocked_days_conf.get("family_birthdays"):
        FamilyBirthdayBlockedCategory.objects.create(
            user=user, category=blocked_days_conf.get("family_birthdays")["category"]
        )
        family_member_phone = "+447234234234"
        family_member = User.objects.create(
            phone_number=family_member_phone,
            username=family_member_phone,
            family=user.family,
        )
        family_member.dob = blocked_days_conf.get("family_birthdays")["date"]
        family_member.save()

    if blocked_days_conf.get("national_holidays"):
        NationalHolidaysBlockedCategory.objects.create(
            user=user, category=blocked_days_conf.get("national_holidays")["category"]
        )
        holiday_task = HolidayTask.objects.create(
            title="TEST_HOLIDAY_TASK",
            start_date=blocked_days_conf.get("national_holidays")["start_date"],
            end_date=blocked_days_conf.get("national_holidays")["end_date"],
            tags=["SOCIAL_INTERESTS__HOLIDAY"],
        )
        holiday_task.members.set([user])

    if blocked_days_conf.get("trips"):
        TripBlockedCategory.objects.create(
            user=user, category=blocked_days_conf.get("trips")["category"]
        )
        trip = Trip.objects.create(
            start_date=blocked_days_conf.get("trips")["start_date"],
            end_date=blocked_days_conf.get("trips")["end_date"],
            owner=user,
        )
        trip.members.set([user])
        trip.save()

    if blocked_days_conf.get("term_times"):
        TermTimeBlockedCategory.objects.create(
            user=user, category=blocked_days_conf.get("term_times")["category"]
        )
        school = School.objects.create(owner=user)
        school.members.set([user])
        school_year = SchoolYear.objects.create(
            school=school, start_date="2020-09-09", end_date="2021-09-09"
        )
        SchoolTerm.objects.create(
            school_year=school_year,
            start_date=blocked_days_conf.get("term_times")["start_date"],
            end_date=blocked_days_conf.get("term_times")["end_date"],
        )

    if blocked_days_conf.get("days_off"):
        DaysOffBlockedCategory.objects.create(
            user=user, category=blocked_days_conf.get("days_off")["category"]
        )
        days_off = DaysOff.objects.create(
            start_date=blocked_days_conf.get("days_off")["start_date"],
            end_date=blocked_days_conf.get("days_off")["end_date"],
            owner=user,
        )
        days_off.members.set([user])
        days_off.save()
