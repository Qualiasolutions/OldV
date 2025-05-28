"""Education models"""
from django.db import models
from phonenumber_field.modelfields import PhoneNumberField  # type: ignore

from core.utils.categories import Categories

from .base import Entity


class EducationEntity(Entity):
    """EducationEntity"""

    def save(self, **kwargs):
        self.category = Categories.EDUCATION.value
        return super().save(**kwargs)

    class Meta:
        abstract = True


class AcademicPlan(EducationEntity):
    """AcademicPlan"""


class ExtracurricularPlan(EducationEntity):
    """ExtracurricularPlan"""


class School(EducationEntity):
    """School"""

    address = models.CharField(null=False, blank=True, max_length=300, default="")
    phone_number = PhoneNumberField(null=True, blank=True)
    email = models.CharField(null=False, blank=True, max_length=100, default="")


class Student(EducationEntity):
    """Student"""

    school_attended = models.ForeignKey(
        School,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="students",
    )


class SchoolYear(models.Model):
    """SchoolYear"""

    start_date = models.DateField(null=False, blank=False)
    end_date = models.DateField(null=False, blank=False)

    school = models.ForeignKey(
        School, on_delete=models.CASCADE, null=False, blank=False, related_name="years"
    )
    year = models.CharField(max_length=63, null=False, blank=False, default="")

    show_on_calendars = models.BooleanField(null=False, blank=True, default=False)


class SchoolBreak(models.Model):
    """SchoolBreak"""

    name = models.CharField(max_length=127, null=False, blank=False, default="")
    start_date = models.DateField(null=False, blank=False)
    end_date = models.DateField(null=False, blank=False)

    school_year = models.ForeignKey(
        SchoolYear,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="breaks",
    )

    show_on_calendars = models.BooleanField(null=False, blank=True, default=False)


class SchoolTerm(models.Model):
    """SchoolTerm"""

    name = models.CharField(max_length=127, null=False, blank=False, default="")
    start_date = models.DateField(null=False, blank=False)
    end_date = models.DateField(null=False, blank=False)

    school_year = models.ForeignKey(
        SchoolYear,
        on_delete=models.CASCADE,
        null=False,
        blank=False,
        related_name="terms",
    )

    show_on_calendars = models.BooleanField(null=False, blank=True, default=False)
    show_only_start_and_end = models.BooleanField(null=False, blank=True, default=True)
