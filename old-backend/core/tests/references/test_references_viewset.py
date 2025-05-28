"""Tests for reference viewset"""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity, Reference, ReferenceGroup
from core.models.users.user_models import User
from core.utils.categories import Categories
from core.views.reference_viewsets import ReferenceViewset


class TestReferencesViewset(TestCase):
    """TestReferencesViewset"""

    def setUp(self):
        test_phone = "+447814123123"
        self.user = User.objects.create(phone_number=test_phone, username=test_phone)
        self.entity = Entity.objects.create(
            name="__ENTITY__", category=Categories.EDUCATION.value, owner=self.user
        )
        self.entity.members.add(self.user)
        self.entity.save()
        self.list_viewset = ReferenceViewset.as_view({"get": "list"})
        self.create_viewset = ReferenceViewset.as_view({"post": "create"})

        self.ref_group = ReferenceGroup.objects.create(
            created_by=self.user, name="__REF_GROUP__"
        )

        self.ref_group.entities.set([self.entity])
        self.ref_group.save()

    def test_can_list_referrences(self):
        """Test can list referrences on own entites"""
        ref_name = "__NAME__"
        ref_value = "__VALUE__"

        ref = Reference.objects.create(
            created_by=self.user,
            name=ref_name,
            value=ref_value,
            group=self.ref_group,
            type="OTHER",
        )
        ref.save()
        req = APIRequestFactory().get("")
        force_authenticate(req, self.user)
        res = self.list_viewset(req)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["name"], ref_name)
        self.assertEqual(res.data[0]["value"], ref_value)

    def test_can_create_reference(self):
        """Test can create a new reference"""
        ref_name = "__NAME__"
        ref_value = "__VALUE__"
        req = APIRequestFactory().post(
            "",
            {
                "name": ref_name,
                "value": ref_value,
                "entities": [self.entity.id],
                "created_by": self.user.id,
                "group": self.ref_group.id,
                "type": "OTHER",
            },
            format="json",
        )

        force_authenticate(req, self.user)
        res = self.create_viewset(req)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        refs = Reference.objects.all()
        self.assertEqual(refs.count(), 1)
        new_ref = refs.first()

        if not new_ref:
            self.fail()

        self.assertEqual(new_ref.name, ref_name)
        self.assertEqual(new_ref.value, ref_value)

    def test_password_redacted(self):
        """Test password references are redacted"""
        ref_name = "__NAME__"
        ref_value = "__VALUE__"

        ref = Reference.objects.create(
            created_by=self.user,
            name=ref_name,
            value=ref_value,
            group=self.ref_group,
            type="PASSWORD",
        )
        ref.save()
        req = APIRequestFactory().get("")
        force_authenticate(req, self.user)
        res = self.list_viewset(req)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["name"], ref_name)
        self.assertEqual(res.data[0]["value"], "__REDACTED__")
