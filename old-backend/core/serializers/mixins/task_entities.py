"""members mixins"""

import logging

from django.db.models import Q
from rest_framework.serializers import ValidationError

from core.models.entities.base import Entity

logger = logging.getLogger(__name__)


class WithEntitiesSerializerMixin:
    """WithEntitiesSerializerMixin"""

    @property
    def _user(self):
        context = getattr(self, "context")
        request = context.get("request", None)
        if request:
            return request.user

    def validate_entities(self, value):
        """validate_entities"""

        if value:
            instance = getattr(self, "instance")
            current_entities = list(instance.entities.all()) if instance else []
            user_member_entities = list(
                Entity.objects.filter(
                    Q(owner=self._user)
                    | Q(members=self._user)
                    | Q(parent__owner=self._user)
                    | Q(parent__members=self._user)
                ).distinct()
            )
            for entity in value:
                if not entity in user_member_entities + current_entities:
                    raise ValidationError(
                        {
                            "message": f"User does not have permissions to tag entity with id {entity.id}",
                            "code": "invalid_entity",
                        }
                    )
        return value

    def create(self, validated_data):
        """create"""
        entities = validated_data.pop("entities", None)
        task = super().create(validated_data)  # type: ignore

        if entities:
            task.entities.set(entities)

        return task

    def update(self, instance, validated_data):
        """update"""
        entities = validated_data.pop("entities", None)
        task = super().update(instance, validated_data)  # type: ignore

        if entities is not None:
            task.entities.set(entities)

        return task
