from django.test import TestCase
from parameterized import parameterized  # type: ignore

from core.models.entities.anniversaries import Anniversary, Birthday
from core.models.entities.lists import List
from core.models.entities.pets import Pet
from core.models.entities.social import Event, Hobby
from core.models.entities.transport import Car
from core.models.entities.travel import Trip
from core.models.users.user_models import Family, User
from core.utils.categories import Categories


class TestEntitySave(TestCase):
    def setUp(self):
        self.family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=self.family
        )

    @parameterized.expand(
        [
            ("Hobby", Hobby, Categories.SOCIAL_INTERESTS.value, {}),
            ("Birthday", Birthday, Categories.SOCIAL_INTERESTS.value, {}),
            ("Anniversary", Anniversary, Categories.SOCIAL_INTERESTS.value, {}),
            (
                "Event",
                Event,
                Categories.SOCIAL_INTERESTS.value,
                {
                    "start_datetime": "2022-01-01T10:00:00",
                    "end_datetime": "2022-01-01T12:00:00",
                },
            ),
            ("Car", Car, Categories.TRANSPORT.value, {}),
            (
                "Trip",
                Trip,
                Categories.TRAVEL.value,
                {"start_date": "2022-02-02", "end_date": "2022-02-07"},
            ),
            ("Pet", Pet, Categories.PETS.value, {}),
        ]
    )
    def test_categories(self, _, Model, expected_category, extra_fields):
        entity = Model.objects.create(
            name="Test Entity", owner=self.user, **extra_fields
        )
        self.assertEqual(entity.category, expected_category)

        entity_forced_category_9 = Model.objects.create(
            name="Test Entity", owner=self.user, category=9, **extra_fields
        )
        self.assertEqual(entity_forced_category_9.category, expected_category)

        entity_forced_category_1 = Model.objects.create(
            name="Test Entity", owner=self.user, category=9, **extra_fields
        )
        self.assertEqual(entity_forced_category_1.category, expected_category)
