"""members mixins"""

import logging

logger = logging.getLogger(__name__)


class WithMembersSerializerMixin:
    """WithMembersSerializerMixin"""

    @property
    def _user(self):
        context = getattr(self, "context")
        request = context.get("request", None)
        if request:
            return request.user

    def create(self, validated_data):
        """create"""
        members = validated_data.pop("members", None)
        obj = super().create(validated_data)  # type: ignore

        if members:
            obj.members.set(members)

        return obj

    def update(self, instance, validated_data):
        """update"""
        members = validated_data.pop("members", None)
        obj = super().update(instance, validated_data)  # type: ignore

        if members:
            obj.members.set(members)

        return obj
