"""Base entity serializers"""
import logging
from typing import cast

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.serializers import (
    CharField,
    CurrentUserDefault,
    ModelSerializer,
    PrimaryKeyRelatedField,
    SerializerMethodField,
    ValidationError,
)

from core.models.categories.categories import ProfessionalCategory
from core.models.entities.base import (
    Entity,
    ProfessionalEntity,
    ProfessionalEntityCategoryMapping,
)
from core.models.users.user_models import User
from core.serializers.mixins.members import WithMembersSerializerMixin

logger = logging.getLogger(__name__)


class EntityBaseSerializer(WithMembersSerializerMixin, ModelSerializer):
    """EntityBaseSerializer"""

    owner = PrimaryKeyRelatedField(
        default=CurrentUserDefault(),
        queryset=get_user_model().objects.all(),
    )

    members = PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(), many=True, required=False
    )

    presigned_image_url = CharField(read_only=True)

    child_entities = SerializerMethodField()
    parent_name = SerializerMethodField()

    class Meta:
        model = Entity
        fields = "__all__"

    def get_child_entities(self, instance):
        """Get the child entities for an entity"""
        child_entities = instance.child_entities.order_by("id")
        return [entity.id for entity in child_entities]

    def get_parent_name(self, instance):
        """Get the name of the parent entity if it exists"""
        if not instance.parent:
            return None
        return instance.parent.name

    @property
    def _user(self):
        request = self.context.get("request", None)
        if request:
            return request.user

    def validate_owner(self, value):
        """validate_owner"""
        request = cast(Request, self.context.get("request"))
        user = cast(User, request.user)
        if not user.family:
            raise ValidationError(
                {
                    "message": "User has no family",
                    "code": "invalid_owner",
                }
            )
        if value not in user.family.users.all():
            raise ValidationError(
                {
                    "message": "User does not exist in this family",
                    "code": "invalid_owner",
                }
            )

        return value

    def validate_category(self, value):
        """validate_category"""
        if value is not None:
            if value in list(range(1, 13)):
                return value
            else:
                raise ValidationError(
                    {
                        "message": f"Invalid category ID {value}",
                        "code": "invalid_category",
                    }
                )

        return value


class ReadWriteSerializerMethodField(serializers.SerializerMethodField):
    """ReadWriteSerializerMethodField
    A writable version of SerializerMethodField
    """

    def __init__(self, method_name=None, **kwargs):
        self.method_name = method_name
        kwargs["source"] = "*"
        super(serializers.SerializerMethodField, self).__init__(**kwargs)

    def to_internal_value(self, data):
        return data


class ProfessionalEntitySerializer(EntityBaseSerializer):
    """ProfessionalEntitySerializer"""

    professional_category = ReadWriteSerializerMethodField()

    class Meta:
        model = ProfessionalEntity
        fields = "__all__"
        read_only_fields = ("category",)

    def get_professional_category(self, instance):
        """Get the professional category for the current user for this entity"""
        mappings = ProfessionalEntityCategoryMapping.objects.filter(
            user=self._user, entity=instance
        )

        first_mapping = mappings.first()
        if not first_mapping:
            return None

        return first_mapping.category.pk

    def validate_professional_category(self, val):
        """Ensure that valid professional category is provided"""
        professional_categories = ProfessionalCategory.objects.filter(
            id=val, user=self._user
        )
        if not professional_categories.exists():
            raise ValidationError("Invalid professional category")

        return {"professional_category": professional_categories.first()}

    def create(self, validated_data, *args, **kwargs):
        professional_category = validated_data.pop("professional_category", None)
        new_entity = super().create(validated_data, *args, **kwargs)

        if professional_category:
            ProfessionalEntityCategoryMapping.objects.create(
                entity=new_entity, user=self._user, category=professional_category
            )

        return new_entity

    def update(self, instance, validated_data, *args, **kwargs):
        professional_category = validated_data.pop("professional_category", None)
        new_entity = super().update(instance, validated_data, *args, **kwargs)

        if professional_category:
            existing_category = ProfessionalEntityCategoryMapping.objects.filter(
                entity=new_entity, user=self._user
            ).first()

            if existing_category:
                existing_category.category = professional_category
                existing_category.save()
            else:
                ProfessionalEntityCategoryMapping.objects.create(
                    entity=new_entity, user=self._user, category=professional_category
                )

        return new_entity
