"""Serializers for lists"""

from django.db.models import Q
from rest_framework.serializers import (
    CharField,
    ModelSerializer,
    SerializerMethodField,
    ValidationError,
)

from core.models.entities.lists import (
    List,
    ListEntry,
    PlanningList,
    PlanningListItem,
    PlanningSublist,
    ShoppingList,
    ShoppingListDelegation,
    ShoppingListItem,
    ShoppingListStore,
)
from core.serializers.mixins.validate_created_by import ValidatedCreatedByMixin

from .base import EntityBaseSerializer


class ListEntrySerializer(ModelSerializer):
    """ListEntrySerializer"""

    presigned_image_url = CharField(read_only=True)
    presigned_image_url_large = CharField(read_only=True)

    class Meta:
        model = ListEntry
        fields = "__all__"
        extra_kwargs = {"image": {"write_only": True}}

    def validate_list(self, value):
        """validate_list"""
        request = self.context.get("request")
        if request:
            user_lists = List.objects.filter(Q(members=request.user))
            if value in user_lists:
                return value
            else:
                raise ValidationError(
                    {
                        "message": f"List with id {value.id} does not exist for current user",
                        "code": "invalid_list",
                    }
                )


class ListSerializer(EntityBaseSerializer):
    """ListSerializer"""

    list_entries = ListEntrySerializer(many=True, read_only=True)

    class Meta:
        model = List
        fields = "__all__"


class PlanningListItemSerializer(ModelSerializer):
    """PlanningListItemSerializer"""

    class Meta:
        model = PlanningListItem
        fields = "__all__"

    def validate_sublist(self, value):
        """validate_sublist"""
        request = self.context.get("request")
        if request:
            user_lists = PlanningSublist.objects.filter(Q(list__members=request.user))
            if value in user_lists:
                return value
            else:
                raise ValidationError(
                    {
                        "message": f"Sublist with id {value.id} does not exist for current user",
                        "code": "invalid_sublist",
                    }
                )


class PlanningSublistSerializer(ModelSerializer):
    """PlanningSublistSerializer"""

    class Meta:
        model = PlanningSublist
        fields = "__all__"

    def validate_list(self, value):
        """validate_list"""
        request = self.context.get("request")
        if request:
            user_lists = PlanningList.objects.filter(Q(members=request.user))
            if value in user_lists:
                return value
            else:
                raise ValidationError(
                    {
                        "message": f"List with id {value.id} does not exist for current user",
                        "code": "invalid_list",
                    }
                )


class PlanningListSerializer(ModelSerializer):
    """PlanningListSerializer"""

    class Meta:
        model = PlanningList
        fields = "__all__"

    def create(self, *args, **kwargs):
        """Should create a sublist with the same name"""
        planning_list: PlanningList = super().create(*args, **kwargs)
        PlanningSublist.objects.create(list=planning_list, title=planning_list.name)
        return planning_list


class ShoppingListItemSerializer(ModelSerializer):
    """ShoppingListItemSerializer"""

    class Meta:
        model = ShoppingListItem
        fields = "__all__"

    def validate_list(self, value):
        """validate_list"""
        request = self.context.get("request")
        if request:
            user_lists = ShoppingList.objects.filter(Q(members=request.user))
            if value in user_lists:
                return value
            else:
                raise ValidationError(
                    {
                        "message": f"List with id {value.id} does not exist for current user",
                        "code": "invalid_list",
                    }
                )


class DelegatedShoppingListItemSerializer(ShoppingListItemSerializer):
    """DelegatedShoppingListItemSerializer"""

    class Meta:
        model = ShoppingListItem
        fields = ("id", "list", "store", "title", "checked")
        read_only_fields = (
            "id",
            "list",
            "store",
            "title",
        )


class ShoppingListSerializer(ModelSerializer):
    """ShoppingListSerializer"""

    class Meta:
        model = ShoppingList
        fields = "__all__"


class ShoppingListStoreSerializer(ValidatedCreatedByMixin, ModelSerializer):
    """ShoppingListStoreSerializer"""

    class Meta:
        model = ShoppingListStore
        fields = "__all__"


class ShoppingListDelegationSerializer(ModelSerializer):
    """ShoppingListDelegationSerializer"""

    store_name = SerializerMethodField()
    list_name = SerializerMethodField()

    class Meta:
        model = ShoppingListDelegation
        fields = "__all__"

    @property
    def _user(self):
        req = self.context.get("request")
        if req:
            return req.user

    def validate_delegator(self, value):
        """validate_delegator"""
        if not self._user == value:
            raise ValidationError(
                {
                    "message": "You cannot delegate for other users",
                    "code": "non_self_delegation",
                }
            )

        return value

    def validate_list(self, value):
        """validate_list"""
        if not self._user in value.members.all():
            raise ValidationError(
                {
                    "message": "You cannot delegate a list without being a member",
                    "code": "non_member_delegation",
                }
            )

        return value

    def validate(self, attrs):
        """validate"""
        validated_data = super().validate(attrs)
        if ShoppingListItem.objects.filter(
            store=attrs["store"], list=attrs["list"]
        ).exists():
            return validated_data
        else:
            raise ValidationError(
                {
                    "store": {
                        "message": "This store does not appear on the list specified",
                        "code": "no_store_delegation",
                    }
                }
            )

    def get_store_name(self, instance):
        """get_store_name"""
        return instance.store.name

    def get_list_name(self, instance):
        """get_list_name"""
        return instance.list.name
