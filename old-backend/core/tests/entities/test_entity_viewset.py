"""Tests for entity viewset"""

import logging

import pytz
from django.apps import apps
from django.test import TestCase
from parameterized import parameterized  # type: ignore
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.categories.categories import ProfessionalCategory
from core.models.entities.base import (
    Entity,
    ProfessionalEntity,
    ProfessionalEntityCategoryMapping,
)
from core.models.users.user_models import Family, User
from core.utils.categories import Categories
from core.views.entity_viewsets import EntityViewSet

utc = pytz.UTC


logger = logging.getLogger(__name__)


class TestEntityViewSet(TestCase):
    """TestEntityViewSet"""

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
        self.friend = User.objects.create(
            username="friend@test.test",
            phone_number="+447123416444",
            family=other_family,
        )
        self.user.friends.add(self.friend)

        self.user_entity = Entity.objects.create(
            name="Test Entity",
            owner=self.user,
            category=Categories.TRANSPORT.value,
        )

        self.entity_list_view = EntityViewSet.as_view({"get": "list"})
        self.entity_retrieve_view = EntityViewSet.as_view({"get": "retrieve"})
        self.entity_create_view = EntityViewSet.as_view({"post": "create"})
        self.entity_patch_view = EntityViewSet.as_view({"patch": "partial_update"})
        self.entity_delete_view = EntityViewSet.as_view({"delete": "destroy"})

    def test_auth_required(self):
        """test_auth_required"""
        request = APIRequestFactory().get("/", {})
        res = self.entity_list_view(request)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_can_get_response(self):
        """test_can_get_response"""
        request = APIRequestFactory().get("", {})
        force_authenticate(request, user=self.family_member)
        res = self.entity_list_view(request)

        self.assertEqual(res.data, [])

    def test_cannot_access_other_user_entity(self):
        """test_cannot_access_other_user_entity"""
        request = APIRequestFactory().get("")
        force_authenticate(request, user=self.user)
        res = self.entity_list_view(request)

        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], self.user_entity.id)

        force_authenticate(request, user=self.non_family_member)
        res = self.entity_list_view(request)
        self.assertEqual(res.data, [])

    def test_cannot_create_entity_with_owner_outside_family(self):
        """test_cannot_create_entity_with_owner_outside_family"""
        request = APIRequestFactory().post(
            "",
            {
                "name": "Test event",
                "resourcetype": "Event",
                "members": [],
                "owner": self.non_family_member.id,
                "start_datetime": "2022-01-01T10:00:00",
                "end_datetime": "2022-01-01T12:00:00",
            },
            format="json",
        )
        force_authenticate(request, user=self.user)
        res = self.entity_create_view(request)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["owner"]["code"], "invalid_owner")

    def test_can_create_entity_with_owner_in_family(self):
        """test_can_create_entity_with_owner_in_family"""
        request = APIRequestFactory().post(
            "",
            {
                "name": "Test event",
                "resourcetype": "Event",
                "members": [],
                "owner": self.family_member.id,
                "start_datetime": "2022-01-01T10:00:00",
                "end_datetime": "2022-01-01T12:00:00",
            },
            format="json",
        )
        force_authenticate(request, user=self.user)
        res = self.entity_create_view(request)
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_can_access_entity_if_member(self):
        """test_can_access_entity_if_member"""
        self.user_entity.members.add(self.family_member)

        request = APIRequestFactory().get("")

        # Owner gets expected response
        force_authenticate(request, user=self.user)
        res = self.entity_list_view(request)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], self.user_entity.id)

        # Member gets expected response
        force_authenticate(request, user=self.family_member)
        res = self.entity_list_view(request)
        self.assertEqual(
            [entity["name"] for entity in res.data], [self.user_entity.name]
        )

    def test_cannot_access_child_entities(self):
        """test_cannot_access_child_entities"""
        child_entity = Entity.objects.create(
            parent=self.user_entity, category=1, name="TEST CHILD ENTITY"
        )
        self.user_entity.members.add(self.family_member)

        request = APIRequestFactory().get("")

        # Owner gets expected response
        force_authenticate(request, user=self.user)
        res = self.entity_list_view(request)
        self.assertEqual(len(res.data), 1)
        self.assertEqual([ent["id"] for ent in res.data], [self.user_entity.id])

        # Member gets expected response
        force_authenticate(request, user=self.family_member)
        res = self.entity_list_view(request)
        self.assertEqual(len(res.data), 1)
        self.assertEqual([ent["id"] for ent in res.data], [self.user_entity.id])

    def test_child_entity_permissions(self):
        """test_child_entity_permissions"""
        user_child_entity = Entity.objects.create(
            name="User Child Entity",
            owner=self.user,
            category=Categories.TRANSPORT.value,
            parent=self.user_entity,
        )

        non_user_child_entity = Entity.objects.create(
            name="Non-User Child Entity",
            owner=self.family_member,
            category=Categories.TRANSPORT.value,
            parent=self.user_entity,
        )

        request = APIRequestFactory().get("")

        # Should be able to see both child entities
        force_authenticate(request, user=self.user)
        res = self.entity_retrieve_view(request, pk=self.user_entity.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["id"], self.user_entity.id)
        self.assertEqual(
            res.data["child_entities"], [user_child_entity.id, non_user_child_entity.id]
        )

    def test_parent_name(self):
        """test_parent_name"""
        user_child_entity = Entity.objects.create(
            name="User Child Entity",
            owner=self.user,
            category=Categories.TRANSPORT.value,
            parent=self.user_entity,
        )
        request = APIRequestFactory().get("")
        force_authenticate(request, user=self.user)

        res = self.entity_retrieve_view(request, pk=user_child_entity.id)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["id"], user_child_entity.id)
        self.assertEqual(res.data["parent_name"], self.user_entity.name)

    @parameterized.expand(
        [
            (
                "List entity without members",
                {
                    "name": "Test list",
                    "category": Categories.TRANSPORT.value,
                    "resourcetype": "List",
                },
                {
                    "name": "Test list",
                    "category": Categories.TRANSPORT.value,
                    "resourcetype": "List",
                    "list_entries": [],
                    "child_entities": [],
                },
            ),
            (
                "List entity with members",
                {
                    "name": "Test list",
                    "category": Categories.TRANSPORT.value,
                    "resourcetype": "List",
                    "members": ["user", "family_member"],
                },
                {
                    "name": "Test list",
                    "category": Categories.TRANSPORT.value,
                    "resourcetype": "List",
                    "list_entries": [],
                    "child_entities": [],
                },
            ),
            (
                "Car entity with members",
                {
                    "name": "Test car",
                    "resourcetype": "Car",
                    "make": "test",
                    "model": "test",
                    "registration": "TE54 ABC",
                    "members": ["user", "family_member"],
                },
                {
                    "name": "Test car",
                    "category": Categories.TRANSPORT.value,
                    "resourcetype": "Car",
                    "child_entities": [],
                },
            ),
            (
                "Car entity with friend members",
                {
                    "name": "Test car",
                    "resourcetype": "Car",
                    "make": "test",
                    "model": "test",
                    "registration": "TE54 ABC",
                    "members": ["user", "family_member", "friend"],
                },
                {
                    "name": "Test car",
                    "category": Categories.TRANSPORT.value,
                    "resourcetype": "Car",
                    "child_entities": [],
                },
            ),
            (
                "Event entity with members",
                {
                    "name": "Test event",
                    "resourcetype": "Event",
                    "members": ["user", "family_member"],
                    "start_datetime": "2022-01-01T10:00:00",
                    "end_datetime": "2022-01-01T12:00:00",
                },
                {
                    "name": "Test event",
                    "category": Categories.SOCIAL_INTERESTS.value,
                    "resourcetype": "Event",
                    "start_datetime": "2022-01-01T10:00:00Z",
                    "end_datetime": "2022-01-01T12:00:00Z",
                },
            ),
            (
                "Hobby entity with members",
                {
                    "name": "Test hobby",
                    "resourcetype": "Hobby",
                    "members": ["user", "family_member"],
                },
                {
                    "name": "Test hobby",
                    "category": Categories.SOCIAL_INTERESTS.value,
                    "resourcetype": "Hobby",
                },
            ),
            (
                "Pet entity with members",
                {
                    "name": "Test pet",
                    "resourcetype": "Pet",
                    "members": ["user", "family_member"],
                },
                {
                    "name": "Test pet",
                    "category": Categories.PETS.value,
                    "resourcetype": "Pet",
                },
            ),
            (
                "Groomer entity with members",
                {
                    "name": "Test Groomer",
                    "resourcetype": "Groomer",
                    "members": ["user", "family_member"],
                },
                {
                    "name": "Test Groomer",
                    "category": Categories.PETS.value,
                    "resourcetype": "Groomer",
                },
            ),
            (
                "Vet entity with members",
                {
                    "name": "Test Vet",
                    "resourcetype": "Vet",
                    "members": ["user", "family_member"],
                },
                {
                    "name": "Test Vet",
                    "category": Categories.PETS.value,
                    "resourcetype": "Vet",
                },
            ),
            (
                "Walker entity with members",
                {
                    "name": "Test Walker",
                    "resourcetype": "Walker",
                    "members": ["user", "family_member"],
                },
                {
                    "name": "Test Walker",
                    "category": Categories.PETS.value,
                    "resourcetype": "Walker",
                },
            ),
            (
                "DaysOff entity",
                {
                    "name": "Test days off",
                    "resourcetype": "DaysOff",
                    "start_date": "2022-10-10",
                    "end_date": "2022-10-15",
                    "members": ["user", "family_member"],
                },
                {
                    "name": "Test days off",
                    "category": Categories.CAREER.value,
                    "resourcetype": "DaysOff",
                    "start_date": "2022-10-10",
                    "end_date": "2022-10-15",
                },
            ),
        ]
    )
    def test_can_create_entities(self, _, entity, expected_response):
        """test_can_create_entities"""
        if entity.get("members"):
            entity_members = entity.pop("members")
            entity["members"] = [
                getattr(self, member_name).id for member_name in entity_members
            ]

        if entity.get("parent"):
            parent = entity.pop("parent")
            entity["parent"] = getattr(self, parent).id

        for format in ["json", "multipart"]:
            request = APIRequestFactory().post(
                "", {**entity, "owner": self.user.id}, format=format
            )

            force_authenticate(request, user=self.user)
            res = self.entity_create_view(request)

            # The returned values should match the values defined
            # in the test expected response values
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
            for key in expected_response:
                self.assertEqual(res.data[key], expected_response[key])

            self.assertEqual(set(res.data["members"]), set(entity.get("members") or []))

            # The returned child entities should be the same as the
            # child entities in the database
            created_entity = apps.get_model(
                "core", res.data["resourcetype"]
            ).objects.get(id=res.data["id"])
            self.assertEqual(
                sorted([ent.id for ent in created_entity.child_entities.all()]),
                res.data["child_entities"],
            )

    def test_can_create_professional_entity(self):
        """test_can_create_professional_entity"""
        professional_category = ProfessionalCategory.objects.create(
            name="TEST_CATEGORY_NAME", user=self.user
        )
        req_body = {
            "name": "Test professional entity",
            "resourcetype": "ProfessionalEntity",
            "professional_category": professional_category.id,
            "owner": self.user.id,
        }
        expected_response = {
            "name": "Test professional entity",
            "resourcetype": "ProfessionalEntity",
            "professional_category": professional_category.id,
            "owner": self.user.id,
            "category": -1,
        }
        for format in ["json", "multipart"]:
            request = APIRequestFactory().post(
                "",
                req_body,
                format=format,
            )

            force_authenticate(request, user=self.user)
            res = self.entity_create_view(request)

            # The returned values should match the values defined
            # in the test expected response values
            self.assertEqual(res.status_code, status.HTTP_201_CREATED)
            for key, val in expected_response.items():
                self.assertEqual(res.data[key], val)

        new_entity = Entity.objects.get(id=res.data["id"])
        self.assertEqual(
            ProfessionalEntityCategoryMapping.objects.filter(
                user=self.user, entity=new_entity, category=professional_category
            ).count(),
            1,
        )

    @parameterized.expand(
        [
            ("List entity", "List", {}, status.HTTP_201_CREATED),
            ("Hobby entity", "Hobby", {}, status.HTTP_201_CREATED),
            (
                "Car entity",
                "Car",
                {
                    "make": "test make",
                    "model": "test model",
                    "registration": "test reg",
                },
                status.HTTP_201_CREATED,
            ),
            (
                "Trip entity",
                "Trip",
                {
                    "start_date": "2022-02-02",
                    "end_date": "2022-02-07",
                    "destination": "Greece",
                },
                status.HTTP_201_CREATED,
            ),
        ]
    )
    def test_default_parent_category(
        self, _, resourcetype, extra_fields, expected_response
    ):
        """test_default_parent_category"""
        request = APIRequestFactory().post(
            "",
            {
                "name": "Test name",
                "resourcetype": resourcetype,
                "parent": self.user_entity.id,
                **extra_fields,
            },
            format="json",
        )

        force_authenticate(request, user=self.user)
        res = self.entity_create_view(request)
        self.assertEqual(res.status_code, expected_response)

    @parameterized.expand(
        [
            ("List category 100", "List", 100, {}, status.HTTP_400_BAD_REQUEST),
            ("List category 13", "List", 13, {}, status.HTTP_400_BAD_REQUEST),
            ("List category 9", "List", 9, {}, status.HTTP_201_CREATED),
            ("List category 5", "List", 5, {}, status.HTTP_201_CREATED),
            ("List category 1", "List", 1, {}, status.HTTP_201_CREATED),
            ("List category 0", "List", 0, {}, status.HTTP_400_BAD_REQUEST),
        ]
    )
    def test_invalid_category(
        self, _, resourcetype, category_id, extra_fields, expected_response
    ):
        """test_invalid_category"""
        request = APIRequestFactory().post(
            "",
            {
                "owner": self.user.id,
                "name": "Test name",
                "category": category_id,
                "resourcetype": resourcetype,
                **extra_fields,
            },
            format="json",
        )

        force_authenticate(request, user=self.user)
        res = self.entity_create_view(request)
        self.assertEqual(res.status_code, expected_response)

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

        def parse_entity(entity):
            if entity.get("members"):
                entity_members = entity.pop("members")
                entity["members"] = [
                    getattr(self, member_name).id for member_name in entity_members
                ]

            if entity.get("parent"):
                parent = entity.pop("parent")
                entity["parent"] = getattr(self, parent).id

            return {**entity, "owner": self.user.id}

        request = APIRequestFactory().post(
            "", [parse_entity(entity) for entity in entities], format="json"
        )

        force_authenticate(request, user=self.user)
        res = self.entity_create_view(request)

        # The returned values should match the values defined
        # in the test expected response values
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.data), len(entities))
        self.assertEqual(
            [entity["name"] for entity in res.data],
            [entity["name"] for entity in entities],
        )

    @parameterized.expand(
        [
            ("Initally uncategorised", False),
            ("Initally categorised", True),
        ]
    )
    def test_can_update_professional_entity(self, _, start_with_category):
        """test_can_update_professional_entity"""
        new_professional_category = ProfessionalCategory.objects.create(
            name="TEST_CATEGORY_NAME", user=self.user
        )
        entity = ProfessionalEntity.objects.create(name="PRO_ENTITY", category=-1)
        entity.members.set([self.user])

        if start_with_category:
            initial_category = ProfessionalCategory.objects.create(
                name="INITIAL_CATEGORY_NAME", user=self.user
            )
            ProfessionalEntityCategoryMapping.objects.create(
                category=initial_category, user=self.user, entity=entity
            )

        req_body = {
            "professional_category": new_professional_category.id,
        }
        expected_response = {
            "professional_category": new_professional_category.id,
        }
        for format in ["json", "multipart"]:
            request = APIRequestFactory().patch(
                "",
                req_body,
                format=format,
            )

            force_authenticate(request, user=self.user)
            res = self.entity_patch_view(request, pk=entity.pk)

            # The returned values should match the values defined
            # in the test expected response values
            self.assertEqual(res.status_code, status.HTTP_200_OK)
            for key, val in expected_response.items():
                self.assertEqual(res.data[key], val)

        new_entity = Entity.objects.get(id=res.data["id"])
        self.assertEqual(
            ProfessionalEntityCategoryMapping.objects.filter(
                user=self.user, entity=new_entity, category=new_professional_category
            ).count(),
            1,
        )
