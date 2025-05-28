"""List entry viewset tests"""

import logging

import pytz
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.lists import List
from core.models.users.user_models import Family, User
from core.utils.categories import Categories
from core.views.entity_viewsets import EntityViewSet
from core.views.list_viewsets import ListEntryViewSet

utc = pytz.UTC


logger = logging.getLogger(__name__)


class TestListEntryViewSet(TestCase):
    """TestListEntryViewSet"""

    def setUp(self):
        family = Family.objects.create()
        other_family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=family
        )
        self.family_member = User.objects.create(
            username="family@test.test", phone_number="+447123456749", family=family
        )
        self.non_family_member = User.objects.create(
            username="non-family@test.test",
            phone_number="+447123456729",
            family=other_family,
        )
        self.user_list = List.objects.create(
            name="My List", category=Categories.TRANSPORT.value, owner=self.user
        )
        self.user_list.members.set([self.user])

        self.list_entry_create_view = ListEntryViewSet.as_view({"post": "create"})
        self.entity_retrieve_view = EntityViewSet.as_view({"get": "retrieve"})

    def test_required_permissions(
        self,
    ):
        """test_required_permissions"""
        request = APIRequestFactory().post(
            "",
            {
                "name": "List entry",
                "list": self.user_list.id,
            },
            format="json",
        )

        # Unauthorized users get 401
        res = self.list_entry_create_view(request)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

        # Users requesting lists for which they don't have permissions get 400
        force_authenticate(request, user=self.family_member)
        res = self.list_entry_create_view(request)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["list"]["code"], "invalid_list")

    def test_list_entry_creation(
        self,
    ):
        """test_list_entry_creation"""
        request = APIRequestFactory().post(
            "",
            {
                "title": "List entry",
                "list": self.user_list.id,
            },
            format="json",
        )

        force_authenticate(request, user=self.user)
        res = self.list_entry_create_view(request)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Check that the list returned from the entity viewset
        # includes the new list entry
        get_list_request = APIRequestFactory().get("", {})
        force_authenticate(get_list_request, user=self.user)
        list_res = self.entity_retrieve_view(get_list_request, pk=self.user_list.id)
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertEqual(list_res.data["list_entries"][0]["title"], "List entry")

    # TODO - the location stuff hasn't really been worked out yet
    # def test_list_entry_creation_with_location(self,):
    #     request = APIRequestFactory().post("", {
    #         "name": "List entry",
    #         "list": self.user_list.id,
    #         "location": "51.5072, 0.1276"
    #     }, format="json")

    #     force_authenticate(request, user=self.user)
    #     res = self.list_entry_create_view(request)
    #     self.assertEqual(res.status_code, status.HTTP_201_CREATED)
