"""List viewsets"""

import logging
from typing import cast

from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.filters import OrderingFilter
from rest_framework.mixins import UpdateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ReadOnlyModelViewSet

from core.models.entities.lists import (
    ListEntry,
    PlanningList,
    PlanningListItem,
    PlanningSublist,
    ShoppingList,
    ShoppingListDelegation,
    ShoppingListItem,
    ShoppingListStore,
)
from core.models.users.user_models import User
from core.serializers.entities.lists import (
    DelegatedShoppingListItemSerializer,
    ListEntrySerializer,
    PlanningListItemSerializer,
    PlanningListSerializer,
    PlanningSublistSerializer,
    ShoppingListDelegationSerializer,
    ShoppingListItemSerializer,
    ShoppingListSerializer,
    ShoppingListStoreSerializer,
)
from core.utils.templates import PLANNING_LIST_TEMPLATES

logger = logging.getLogger(__name__)


class ListEntryViewSet(ModelViewSet):
    """Viewset for ListEntry objects"""

    serializer_class = ListEntrySerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            ListEntry.objects.all()
            .filter(
                Q(list__owner=self.request.user) | (Q(list__members=self.request.user))
            )
            .distinct()
        )


class PlanningListViewSet(ModelViewSet):
    """PlanningListViewSet"""

    serializer_class = PlanningListSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            PlanningList.objects.all()
            .filter(Q(members=self.request.user) & Q(is_template=False))
            .distinct()
        )


class PlanningListTemplatesViewSet(ModelViewSet):
    """PlanningListTemplatesViewSet"""

    serializer_class = PlanningListSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            PlanningList.objects.all()
            .filter(Q(members=self.request.user) & Q(is_template=True))
            .distinct()
        )


class PlanningSublistViewSet(ModelViewSet):
    """PlanningSublistViewSet"""

    serializer_class = PlanningSublistSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            PlanningSublist.objects.all()
            .filter(Q(list__members=self.request.user))
            .distinct()
        )


class PlanningListItemViewSet(ModelViewSet):
    """PlanningListItemViewSet"""

    serializer_class = PlanningListItemSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    filter_backends = [
        OrderingFilter,
    ]
    ordering = ["pk"]

    def get_queryset(self):
        return (
            PlanningListItem.objects.all()
            .filter(Q(sublist__list__members=self.request.user))
            .distinct()
        )


class ShoppingListViewSet(ModelViewSet):
    """ShoppingListViewSet"""

    serializer_class = ShoppingListSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            ShoppingList.objects.all().filter(Q(members=self.request.user)).distinct()
        )


class ShoppingListItemViewSet(ModelViewSet):
    """ShoppingListItemViewSet"""

    serializer_class = ShoppingListItemSerializer
    permission_classes = [
        IsAuthenticated,
    ]
    filter_backends = [
        OrderingFilter,
    ]
    ordering = ["pk"]

    def get_queryset(self):
        return (
            ShoppingListItem.objects.all()
            .filter(Q(list__members=self.request.user))
            .distinct()
        )


class DelegatedShoppingListItemViewSet(UpdateModelMixin, ReadOnlyModelViewSet):
    """DelegatedShoppingListItemViewSet"""

    serializer_class = DelegatedShoppingListItemSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        received_delegations = ShoppingListDelegation.objects.filter(delegatee=user)
        delegated_item_ids = []
        for delegation in received_delegations.all():
            delegated_item_ids += [
                item.id
                for item in list(
                    ShoppingListItem.objects.all()
                    .filter(Q(list=delegation.list) & Q(store=delegation.store))
                    .distinct()
                )
            ]

        return ShoppingListItem.objects.all().filter(pk__in=delegated_item_ids)


class ShoppingListStoreViewSet(ModelViewSet):
    """ShoppingListStoreViewSet"""

    serializer_class = ShoppingListStoreSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            ShoppingListStore.objects.all()
            .filter(
                Q(created_by=self.request.user)
                | Q(items__list__members=self.request.user)
            )
            .distinct()
        )


class ShoppingListDelegationViewSet(ModelViewSet):
    """ShoppingListDelegationViewSet"""

    serializer_class = ShoppingListDelegationSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            ShoppingListDelegation.objects.all()
            .filter(Q(delegator=self.request.user) | Q(delegatee=self.request.user))
            .distinct()
        )

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, many=True)
        serializer.is_valid(raise_exception=True)

        try:
            self.perform_create(serializer)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_template(request):
    """Create a template (or create a list from an existing template)"""
    title = request.data.get("title")
    list_id = request.data.get("list")
    from_template = request.data.get("from_template")
    user = cast(User, request.user)

    if not list_id:
        return Response(
            {"success": False, "detail": "List ID is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not title:
        return Response(
            {"success": False, "detail": "title is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    base_list = PlanningList.objects.filter(id=list_id).first()

    if not base_list:
        return Response(
            {"success": False, "detail": "no such list exists"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not user in base_list.members.all():
        return Response(
            {
                "success": False,
                "detail": "User does not have permission to clone this list",
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )

    new_template = PlanningList.objects.create(
        name=title, is_template=(not from_template), category=base_list.category
    )
    new_template.members.set([user])

    sublists = base_list.sublists.all()
    for sublist in sublists:
        new_sublist = PlanningSublist.objects.create(
            list=new_template, title=sublist.title
        )

        list_items = sublist.items.all()
        for list_item in list_items:
            PlanningListItem.objects.create(title=list_item.title, sublist=new_sublist)

    return Response(
        {"success": True, "id": new_template.id},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_from_default_template(request):
    """Create a list from a default template"""
    list_template = request.data.get("list_template")
    title = request.data.get("title")
    user = cast(User, request.user)

    if not title:
        return Response(
            {"success": False, "detail": "title is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not list_template:
        return Response(
            {"success": False, "detail": "List template name is required"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not list_template in PLANNING_LIST_TEMPLATES:
        return Response(
            {"success": False, "detail": "Invalid list template name"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    template_dict = PLANNING_LIST_TEMPLATES[list_template]

    new_list = PlanningList.objects.create(
        name=title, category=template_dict["category"]
    )
    new_list.members.set([user])

    sublist_dict = template_dict["content"]
    for sublist_name, sublist_items in sublist_dict.items():
        new_sublist = PlanningSublist.objects.create(list=new_list, title=sublist_name)

        for list_item in sublist_items:
            PlanningListItem.objects.create(title=list_item, sublist=new_sublist)

    return Response(
        {"success": True, "id": new_list.id},
        status=status.HTTP_201_CREATED,
    )
