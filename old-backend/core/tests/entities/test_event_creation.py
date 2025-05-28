import pytz
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity
from core.models.entities.social import EventSubentity
from core.models.users.user_models import Family, User
from core.utils.categories import Categories
from core.views.entity_viewsets import EntityViewSet

utc = pytz.UTC


class TestEventCreation(TestCase):
    """Test create event"""

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

        self.entity_create_view = EntityViewSet.as_view({"post": "create"})

    def test_event_creation(
        self,
    ):
        """test_event_creation"""
        request = APIRequestFactory().post(
            "",
            {
                "name": "Test event",
                "resourcetype": "Event",
                "members": [self.user.id, self.family_member.id],
                "owner": self.user.id,
                "start_datetime": "2022-01-01T10:00:00",
                "end_datetime": "2022-01-01T12:00:00",
            },
            format="json",
        )

        force_authenticate(request, user=self.user)
        res = self.entity_create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        child_subentities = EventSubentity.objects.filter(parent=res.data["id"]).all()
        self.assertEqual(
            {subentity.name for subentity in child_subentities},
            {
                "Food / Cake / Candles",
                "Activities / Venue",
                "Party Favours / Games",
                "Gifts / Wrapping",
                "Music",
                "Decorations",
                # "Guest list",
            },
        )
        self.assertEqual(
            {subentity.subtype for subentity in child_subentities},
            {
                "food",
                "venue",
                "party_favours",
                "gifts",
                "music",
                "decorations",
                # "guest_list",
            },
        )
