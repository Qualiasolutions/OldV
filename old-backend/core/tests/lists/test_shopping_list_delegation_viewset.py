"""TestShoppingListDelegationViewSet"""

import logging

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.lists import ShoppingList, ShoppingListItem, ShoppingListStore
from core.models.users.user_models import Family, User
from core.views.list_viewsets import ShoppingListDelegationViewSet

logger = logging.getLogger(__name__)


class TestShoppingListDelegationViewSet(TestCase):
    """TestShoppingListDelegationViewSet"""

    def setUp(self):
        self.family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=self.family
        )
        self.other_user = User.objects.create(
            username="other@test.test", phone_number="+447123456111", family=self.family
        )
        self.create_view = ShoppingListDelegationViewSet.as_view({"post": "create"})
        self.store = ShoppingListStore.objects.create(
            name="__STORE__", created_by=self.user
        )
        self.list = ShoppingList.objects.create(name="__LIST__")
        self.list.members.set([self.user])

        self.list_item = ShoppingListItem.objects.create(
            title="__ITEM__", store=self.store, list=self.list
        )

    def test_can_delegate(self):
        """test_can_delegate"""
        req = APIRequestFactory().post(
            "",
            [
                {
                    "list": self.list.pk,
                    "store": self.store.pk,
                    "delegator": self.user.pk,
                    "delegatee": self.other_user.pk,
                }
            ],
            format="json",
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_cannot_delegate_without_item(self):
        """test_cannot_delegate_without_item"""
        self.list_item.delete()
        req = APIRequestFactory().post(
            "",
            [
                {
                    "list": self.list.pk,
                    "store": self.store.pk,
                    "delegator": self.user.pk,
                    "delegatee": self.other_user.pk,
                }
            ],
            format="json",
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data[0]["store"]["code"], "no_store_delegation")

    def test_cannot_delegate_without_list_perms(self):
        """test_cannot_delegate_without_list_perms"""
        self.list.members.set([])
        req = APIRequestFactory().post(
            "",
            [
                {
                    "list": self.list.pk,
                    "store": self.store.pk,
                    "delegator": self.user.pk,
                    "delegatee": self.other_user.pk,
                }
            ],
            format="json",
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data[0]["list"]["code"], "non_member_delegation")
