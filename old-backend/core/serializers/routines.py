from rest_framework.serializers import ModelSerializer
from core.models.routines.routines import Routine
from core.serializers.mixins.members import WithMembersSerializerMixin


class RoutineSerializer(
    ModelSerializer,
    WithMembersSerializerMixin
):
    """RoutineSerializer"""
    class Meta:
        model = Routine
        fields = "__all__"
