"""Education serializers"""
from rest_framework.serializers import ModelSerializer, ValidationError

from core.models.entities.education import (
    AcademicPlan,
    ExtracurricularPlan,
    School,
    SchoolBreak,
    SchoolTerm,
    SchoolYear,
    Student,
)

from .base import EntityBaseSerializer


class AcademicPlanSerializer(EntityBaseSerializer):
    """AcademicPlanSerializer"""

    class Meta:
        model = AcademicPlan
        fields = "__all__"
        read_only_fields = ("category",)


class ExtracurricularPlanSerializer(EntityBaseSerializer):
    """ExtracurricularPlanSerializer"""

    class Meta:
        model = ExtracurricularPlan
        fields = "__all__"
        read_only_fields = ("category",)


class SchoolSerializer(EntityBaseSerializer):
    """SchoolSerializer"""

    class Meta:
        model = School
        fields = "__all__"
        read_only_fields = ("category",)


class StudentSerializer(EntityBaseSerializer):
    """StudentSerializer"""

    class Meta:
        model = Student
        fields = "__all__"
        read_only_fields = ("category",)


class SchoolYearSerializer(ModelSerializer):
    """SchoolYearSerializer"""

    class Meta:
        model = SchoolYear
        fields = "__all__"

    @property
    def _user(self):
        req = self.context.get("request")
        if req:
            return req.user

    def validate_school(self, value):
        """Ensure that the school provided for school terms is valid"""
        if not self._user in value.members.all():
            raise ValidationError(
                {
                    "message": "User does not have permission to add a term to that school",
                    "code": "invalid_school",
                }
            )

        return value


class SchoolBreakSerializer(ModelSerializer):
    """SchoolBreakSerializer"""

    class Meta:
        model = SchoolBreak
        fields = "__all__"

    @property
    def _user(self):
        req = self.context.get("request")
        if req:
            return req.user

    def validate_school_year(self, value):
        """Ensure that the school year provided is valid"""
        if not self._user in value.school.members.all():
            raise ValidationError(
                {
                    "message": "User does not have permission to add a term to that school",
                    "code": "invalid_school_year",
                }
            )

        return value


class SchoolTermSerializer(ModelSerializer):
    """SchoolTermSerializer"""

    class Meta:
        model = SchoolTerm
        fields = "__all__"

    @property
    def _user(self):
        req = self.context.get("request")
        if req:
            return req.user

    def validate_school_year(self, value):
        """Ensure that the school year provided is valid"""
        if not self._user in value.school.members.all():
            raise ValidationError(
                {
                    "message": "User does not have permission to add a term to that school",
                    "code": "invalid_school_year",
                }
            )

        return value
