from rest_framework.serializers import ModelSerializer

from core.models.timeblocks.timeblocks import TimeBlock
from core.serializers.mixins.members import WithMembersSerializerMixin


class TimeBlockSerializer(ModelSerializer, WithMembersSerializerMixin):
    """TimeBlockSerializer"""

    class Meta:
        model = TimeBlock
        fields = "__all__"
