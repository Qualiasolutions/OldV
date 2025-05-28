"""HealthBeauty Serializers"""

from core.models.entities.health import Appointment, HealthBeauty, HealthGoal, Patient

from .base import EntityBaseSerializer


class HealthBeautySerializer(EntityBaseSerializer):
    """HealthBeautySerializer"""

    class Meta:
        model = HealthBeauty
        fields = "__all__"
        read_only_fields = ("category",)


class PatientSerializer(EntityBaseSerializer):
    """PatientSerializer"""

    class Meta:
        model = Patient
        fields = "__all__"
        read_only_fields = ("category",)


class AppointmentSerializer(EntityBaseSerializer):
    """AppointmentSerializer"""

    class Meta:
        model = Appointment
        fields = "__all__"
        read_only_fields = ("category",)


class HealthGoalSerializer(EntityBaseSerializer):
    """HealthGoalSerializer"""

    class Meta:
        model = HealthGoal
        fields = "__all__"
        read_only_fields = ("category",)
