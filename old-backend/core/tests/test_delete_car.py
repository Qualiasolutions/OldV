from django.apps import apps
from django.conf import settings
from django.test import TestCase

from core.models.entities.transport import Car
from core.utils.categories import Categories


class DeleteCar(TestCase):
    def test_create_then_delete(self):
        # Create an owner
        owner = apps.get_model(settings.AUTH_USER_MODEL)(
            username="test_user", phone_number="+447814187441"
        )
        owner.save()

        # Create a car
        car = Car(
            name="Test Car",
            make="Test Make",
            model="Test Model",
            registration="TST123",
            category=Categories.TRANSPORT.value,
            owner=owner,
        )
        car.save()

        # Just need this not to error
        Car.objects.get(id=car.id).delete()
