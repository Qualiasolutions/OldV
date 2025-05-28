"""Serializers for career models"""
from core.models.entities.career import CareerGoal, DaysOff, Employee

from .base import EntityBaseSerializer


class DaysOffSerializer(EntityBaseSerializer):
    """DaysOffSerializer"""

    class Meta:
        model = DaysOff
        fields = "__all__"
        read_only_fields = ("category",)


class EmployeeSerializer(EntityBaseSerializer):
    """EmployeeSerializer"""

    class Meta:
        model = Employee
        fields = "__all__"
        read_only_fields = ("category",)


class CareerGoalSerializer(EntityBaseSerializer):
    """CareerGoalSerializer"""

    class Meta:
        model = CareerGoal
        fields = "__all__"
        read_only_fields = ("category",)
