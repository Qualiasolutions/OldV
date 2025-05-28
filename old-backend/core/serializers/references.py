import logging
from typing import cast

from django.forms import ValidationError
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.serializers import ModelSerializer, PrimaryKeyRelatedField

from core.models.entities.base import Entity, Reference, ReferenceGroup
from core.models.users.user_models import User
from core.serializers.mixins.task_entities import WithEntitiesSerializerMixin
from core.serializers.mixins.validate_created_by import ValidatedCreatedByMixin

logger = logging.getLogger(__name__)


class ReferenceSerializer(ValidatedCreatedByMixin, ModelSerializer):
    """ReferenceSerializer"""

    class Meta:
        model = Reference
        fields = "__all__"

    def to_representation(self, instance):
        representation = super().to_representation(instance)

        if representation["type"] == "PASSWORD":
            representation["value"] = "__REDACTED__"

        return representation


class UnredactedReferenceSerializer(ModelSerializer):
    """UnredactedReferenceSerializer"""

    class Meta:
        model = Reference
        fields = "__all__"


class ReferenceGroupSerializer(
    ValidatedCreatedByMixin, WithEntitiesSerializerMixin, ModelSerializer
):
    """ReferenceGroupSerializer"""

    entities: PrimaryKeyRelatedField = PrimaryKeyRelatedField(
        queryset=Entity.objects.all(), many=True, required=False
    )

    class Meta:
        model = ReferenceGroup
        fields = "__all__"
