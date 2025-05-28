"""Tests for reference viewset"""
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity, Reference, ReferenceGroup
from core.models.users.user_models import User
from core.utils.categories import Categories
from core.views.reference_viewsets import retrieve_password_reference


class TestReferencesViewset(TestCase):
    """TestReferencesViewset"""

    def setUp(self):
        test_phone = "+447814123123"
        self.user = User.objects.create(phone_number=test_phone, username=test_phone)

        self.user_password = "__PASSWORD__"
        self.user.set_password(self.user_password)
        self.user.save()
        self.entity = Entity.objects.create(
            name="__ENTITY__", category=Categories.EDUCATION.value, owner=self.user
        )
        self.entity.members.add(self.user)
        self.entity.save()

        self.ref_group = ReferenceGroup.objects.create(
            created_by=self.user, name="__REF_GROUP__"
        )

        self.ref_group.entities.set([self.entity])
        self.ref_group.save()

    def test_can_retrieve_password(self):
        """Test can retrieve password on own entites"""
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
        req = APIRequestFactory().post(
            "", {"reference": ref.id, "password": self.user_password}
        )
        force_authenticate(req, self.user)
        res = retrieve_password_reference(req)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], ref_name)
        self.assertEqual(res.data["value"], ref_value)

    def test_cannot_retrieve_password_with_wrong_master_password(self):
        """Test should get 401 with the wrong password"""
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
        req = APIRequestFactory().post(
            "", {"reference": ref.id, "password": "NOT_THE_RIGHT_PASWORD"}
        )
        force_authenticate(req, self.user)
        res = retrieve_password_reference(req)

        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
