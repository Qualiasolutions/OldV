"""Tests for reference group viewset"""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity, ReferenceGroup
from core.models.users.user_models import User
from core.utils.categories import Categories
from core.views.reference_viewsets import ReferenceGroupViewset


class TestReferenceGroupViewset(TestCase):
    """TestReferenceGroupViewset"""

    def setUp(self):
        test_phone = "+447814123123"
        self.user = User.objects.create(phone_number=test_phone, username=test_phone)
        self.entity = Entity.objects.create(
            name="__ENTITY__", category=Categories.EDUCATION.value, owner=self.user
        )
        self.entity.members.add(self.user)
        self.entity.save()
        self.list_viewset = ReferenceGroupViewset.as_view({"get": "list"})
        self.create_viewset = ReferenceGroupViewset.as_view({"post": "create"})

    def test_can_list_references(self):
        """Test can list reference groups on own entites"""
        ref_group_name = "__REF_GROUP__"
        ref_group = ReferenceGroup.objects.create(
            created_by=self.user, name=ref_group_name
        )
        ref_group.entities.set([self.entity])
        ref_group.save()

        req = APIRequestFactory().get("")
        force_authenticate(req, self.user)
        res = self.list_viewset(req)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["name"], ref_group_name)

    def test_can_create_reference(self):
        """Test can create a new reference group"""
        ref_group_name = "__NAME__"
        req = APIRequestFactory().post(
            "",
            {
                "name": ref_group_name,
                "entities": [self.entity.id],
                "created_by": self.user.id,
            },
            format="json",
        )

        force_authenticate(req, self.user)
        res = self.create_viewset(req)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        ref_groups = ReferenceGroup.objects.all()
        self.assertEqual(ref_groups.count(), 1)
        new_ref_group = ref_groups.first()

        if not new_ref_group:
            self.fail()

        self.assertEqual(new_ref_group.name, ref_group_name)
