"""List entry viewset tests"""

import logging

import pytz
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.lists import ShoppingList
from core.models.users.user_models import Family, User
from core.views.list_viewsets import (
    ShoppingListItemViewSet,
    ShoppingListStoreViewSet,
    ShoppingListViewSet,
)

utc = pytz.UTC


logger = logging.getLogger(__name__)


class TestShoppingListViewSet(TestCase):
    """TestShoppingListViewSet"""

    def setUp(self):
        self.family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=self.family
        )
        self.create_view = ShoppingListViewSet.as_view({"post": "create"})

    def test_create_list(self):
        """test_create_list"""
        req = APIRequestFactory().post(
            "", {"name": "A_LIST", "members": [self.user.id]}
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        new_list = ShoppingList.objects.get(id=res.data["id"])
        self.assertTrue(self.user in new_list.members.all())


class TestShoppingListItemViewSet(TestCase):
    """TestShoppingListItemViewSet"""

    def setUp(self):
        self.family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=self.family
        )
        self.create_view = ShoppingListItemViewSet.as_view({"post": "create"})

        self.list = ShoppingList.objects.create(name="A_LIST")
        self.list.members.set([self.user])

    def test_cannot_create_item_for_random_sublist(self):
        """test_cannot_create_item_for_random_sublist"""
        memberless_list = ShoppingList.objects.create(name="ANOTHER_LIST")
        req = APIRequestFactory().post(
            "", {"list": memberless_list.id, "title": "AN_ITEM"}
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["list"]["code"], "invalid_list")

    def test_create_item(self):
        """test_create_item"""
        req = APIRequestFactory().post("", {"list": self.list.id, "title": "AN_ITEM"})
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)


class TestShoppingListStoreViewSet(TestCase):
    """TestShoppingListStoreViewSet"""

    def setUp(self):
        self.family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=self.family
        )
        self.create_view = ShoppingListStoreViewSet.as_view({"post": "create"})

    def test_can_create_store(self):
        """test_can_create_store"""
        req = APIRequestFactory().post(
            "", {"name": "TEST_STORE", "created_by": self.user.id}
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
