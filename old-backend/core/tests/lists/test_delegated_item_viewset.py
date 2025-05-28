"""TestDelegatedShoppingListItemViewSet"""

import logging

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.lists import (
    ShoppingList,
    ShoppingListDelegation,
    ShoppingListItem,
    ShoppingListStore,
)
from core.models.users.user_models import Family, User
from core.views.list_viewsets import DelegatedShoppingListItemViewSet

logger = logging.getLogger(__name__)


class TestDelegatedShoppingListItemViewSet(TestCase):
    """TestDelegatedShoppingListItemViewSet"""

    def setUp(self):
        self.family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=self.family
        )
        self.other_user = User.objects.create(
            username="other@test.test", phone_number="+447123456111", family=self.family
        )
        self.list_view = DelegatedShoppingListItemViewSet.as_view({"get": "list"})
        self.update_view = DelegatedShoppingListItemViewSet.as_view({"patch": "update"})
        self.store = ShoppingListStore.objects.create(
            name="__STORE__", created_by=self.user
        )
        self.list = ShoppingList.objects.create(name="__LIST__")
        self.list.members.set([self.user])

    def test_list_delegated_items(self):
        """test_list_delegated_items"""
        ShoppingListDelegation.objects.create(
            delegator=self.user,
            delegatee=self.other_user,
            store=self.store,
            list=self.list,
        )

        num_items = 100
        for i in range(num_items):
            ShoppingListItem.objects.create(
                title=f"__ITEM{i}__", store=self.store, list=self.list
            )

        request = APIRequestFactory().get("")
        force_authenticate(request, self.other_user)

        res = self.list_view(request)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), num_items)

    def test_check_delegated_item(self):
        """test_check_delegated_item"""
        ShoppingListDelegation.objects.create(
            delegator=self.user,
            delegatee=self.other_user,
            store=self.store,
            list=self.list,
        )

        item = ShoppingListItem.objects.create(
            title="__ITEM__", store=self.store, list=self.list
        )

        request = APIRequestFactory().patch("", {"checked": True})
        force_authenticate(request, self.other_user)

        res = self.update_view(request, pk=item.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
