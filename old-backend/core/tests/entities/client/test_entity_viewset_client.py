import json
import logging

import pytz
from django.test import TestCase
from django.urls import reverse
from parameterized import parameterized  # type: ignore
from rest_framework import status

from core.models.entities.base import Entity
from core.models.users.user_models import Family, User
from core.utils.categories import Categories

utc = pytz.UTC

logger = logging.getLogger(__name__)


class BaseTestCase(TestCase):
    """Base"TestCase"""

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

        self.user_entity = Entity.objects.create(
            name="Test Entity",
            owner=self.user,
            category=Categories.TRANSPORT.value,
        )

        self.url = reverse("entity-list")

    def parse_entity(self, entity):
        """parse_entity"""
        if entity.get("members"):
            entity_members = entity.pop("members")
            entity["members"] = [
                getattr(self, member_name).id for member_name in entity_members
            ]

        if entity.get("parent"):
            parent = entity.pop("parent")
            entity["parent"] = getattr(self, parent).id

        return {**entity, "owner": self.user.id}


class TestEntityViewSet(BaseTestCase):
    @parameterized.expand(
        [
            (
                "Hobbies",
                [
                    {
                        "resourcetype": "Hobby",
                        "name": "Test Hobby",
                    },
                    {
                        "resourcetype": "Hobby",
                        "name": "Another Hobby",
                    },
                    {
                        "resourcetype": "Hobby",
                        "name": "Third Hobby",
                    },
                ],
            ),
            (
                "Hobbies with members / parent",
                [
                    {
                        "resourcetype": "Hobby",
                        "name": "Test Hobby",
                        "members": ["user", "family_member"],
                    },
                    {
                        "resourcetype": "Hobby",
                        "name": "Another Hobby",
                        "parent": "user_entity",
                    },
                    {
                        "resourcetype": "Hobby",
                        "name": "Third Hobby",
                    },
                ],
            ),
        ]
    )
    def test_can_bulk_create_entities(self, _, entities):
        """test_can_bulk_create_entities"""
        self.client.force_login(self.user)
        res = self.client.post(
            self.url,
            data=json.dumps([self.parse_entity(entity) for entity in entities]),
            content_type="application/json",
        )

        # The returned values should match the values defined
        # in the test expected response values
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.json()), len(entities))
        self.assertEqual(
            [entity["name"] for entity in res.json()],
            [entity["name"] for entity in entities],
        )

    @parameterized.expand(
        [
            (
                "Hobbies",
                {
                    "resourcetype": "Hobby",
                    "name": "Test Hobby",
                },
            ),
            (
                "Hobbies with members / parent",
                {
                    "resourcetype": "Hobby",
                    "name": "Test Hobby",
                    "members": ["user", "family_member"],
                },
            ),
        ]
    )
    def test_can_delete_single_entities(self, _, entity):
        """test_can_delete_single_entities"""
        self.client.force_login(self.user)
        create_res = self.client.post(
            self.url,
            data=json.dumps(self.parse_entity(entity)),
            content_type="application/json",
        )

        id = create_res.json()["id"]

        # Ensure that this entity exists
        self.assertTrue(Entity.objects.filter(id=id).all())

        res = self.client.delete(
            self.url + str(id) + "/", content_type="application/json"
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # Ensure that this entity doesn't exist
        self.assertFalse(Entity.objects.filter(id=create_res.json()["id"]).all())

    @parameterized.expand(
        [
            (
                "Hobbies",
                [
                    {
                        "resourcetype": "Hobby",
                        "name": "Test Hobby",
                    },
                    {
                        "resourcetype": "Hobby",
                        "name": "Another Hobby",
                    },
                    {
                        "resourcetype": "Hobby",
                        "name": "Third Hobby",
                    },
                ],
            ),
            (
                "Hobbies with members / parent",
                [
                    {
                        "resourcetype": "Hobby",
                        "name": "Test Hobby",
                        "members": ["user", "family_member"],
                    },
                    {
                        "resourcetype": "Hobby",
                        "name": "Another Hobby",
                        "parent": "user_entity",
                    },
                    {
                        "resourcetype": "Hobby",
                        "name": "Third Hobby",
                    },
                ],
            ),
        ]
    )
    def test_can_bulk_delete_entities(self, _, entities):
        """test_can_bulk_delete_entities"""
        self.client.force_login(self.user)
        create_res = self.client.post(
            self.url,
            data=json.dumps([self.parse_entity(entity) for entity in entities]),
            content_type="application/json",
        )

        # Ensure that these entities exist
        for id in [ent["id"] for ent in create_res.json()]:
            self.assertTrue(Entity.objects.filter(id=id).all())

        res = self.client.delete(
            self.url,
            data={"pk_ids": [ent["id"] for ent in create_res.json()]},
            content_type="application/json",
        )

        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)

        # Ensure that these entities don't exist
        for id in [ent["id"] for ent in create_res.json()]:
            self.assertFalse(Entity.objects.filter(id=id).all())
