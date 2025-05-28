"""List entry viewset tests"""

import logging

import pytz
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.lists import PlanningList, PlanningSublist
from core.models.users.user_models import Family, User
from core.views.list_viewsets import (
    PlanningListItemViewSet,
    PlanningListViewSet,
    PlanningSublistViewSet,
)

utc = pytz.UTC


logger = logging.getLogger(__name__)


class TestPlanningListViewSet(TestCase):
    """TestPlanningListViewSet"""

    def setUp(self):
        self.family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=self.family
        )
        self.create_view = PlanningListViewSet.as_view({"post": "create"})

    def test_create_list(self):
        """test_create_list"""
        req = APIRequestFactory().post(
            "", {"category": 1, "name": "A_LIST", "members": [self.user.id]}
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        new_list = PlanningList.objects.get(id=res.data["id"])
        self.assertTrue(self.user in new_list.members.all())


class TestPlanningSublistViewSet(TestCase):
    """TestPlanningSublistViewSet"""

    def setUp(self):
        self.family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=self.family
        )
        self.create_view = PlanningSublistViewSet.as_view({"post": "create"})

        self.list = PlanningList.objects.create(category=1, name="A_LIST")
        self.list.members.set([self.user])

    def test_cannot_create_sublist_for_random_list(self):
        """test_cannot_create_sublist_for_random_list"""
        memberless_list = PlanningList.objects.create(category=1, name="ANOTHER_LIST")
        req = APIRequestFactory().post(
            "", {"list": memberless_list.id, "title": "A_SUBLIST"}
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["list"]["code"], "invalid_list")

    def test_create_sublist(self):
        """test_create_sublist"""
        req = APIRequestFactory().post("", {"list": self.list.id, "title": "A_SUBLIST"})
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)


class TestPlanningListItemViewSet(TestCase):
    """TestPlanningListItemViewSet"""

    def setUp(self):
        self.family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=self.family
        )
        self.create_view = PlanningListItemViewSet.as_view({"post": "create"})

        self.list = PlanningList.objects.create(category=1, name="A_LIST")
        self.list.members.set([self.user])

        self.sublist = PlanningSublist.objects.create(list=self.list, title="A_SUBLIST")

    def test_cannot_create_sublist_for_random_list(self):
        """test_cannot_create_sublist_for_random_list"""
        memberless_list = PlanningList.objects.create(category=1, name="ANOTHER_LIST")
        sublist = PlanningSublist.objects.create(
            list=memberless_list, title="A_SUBLIST"
        )
        req = APIRequestFactory().post("", {"sublist": sublist.id, "title": "AN_ITEM"})
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["sublist"]["code"], "invalid_sublist")

    def test_create_sublist(self):
        """test_create_sublist"""
        req = APIRequestFactory().post(
            "", {"sublist": self.sublist.id, "title": "AN_ITEM"}
        )
        force_authenticate(req, self.user)
        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
