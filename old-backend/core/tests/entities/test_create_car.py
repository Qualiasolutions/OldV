"""Test can create car"""

import logging
from datetime import timedelta

import pytz
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.transport import Car
from core.models.users.user_models import Family, User
from core.views.entity_viewsets import EntityViewSet

utc = pytz.UTC


logger = logging.getLogger(__name__)


class TestCreateCar(TestCase):
    """TestCreateCar"""

    def setUp(self):
        family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=family
        )
        self.entity_create_view = EntityViewSet.as_view({"post": "create"})

    def test_can_create_car_with_mot_etc(self):
        """test_can_create_car_with_mot_etc"""
        request = APIRequestFactory().post(
            "",
            {
                "resourcetype": "Car",
                "name": "Test car",
                "make": "test",
                "model": "test",
                "registration": "TE54 ABC",
                "members": [self.user.id],
                "owner": self.user.id,
                "mot_due_date": "2023-01-01",
                "mot_reminder_interval": "MONTHLY",
                "mot_due_date_members": [self.user.id],
                "insurance_due_date": "2023-01-01",
                "insurance_reminder_interval": "MONTHLY",
                "insurance_due_date_members": [self.user.id],
                "service_due_date": "2023-01-01",
                "service_reminder_interval": "MONTHLY",
                "service_due_date_members": [self.user.id],
                "warranty_due_date": "2023-01-01",
                "warranty_reminder_interval": "MONTHLY",
                "warranty_due_date_members": [self.user.id],
                "tax_due_date": "2023-01-01",
                "tax_reminder_interval": "MONTHLY",
                "tax_due_date_members": [self.user.id],
            },
            format="json",
        )

        force_authenticate(request, user=self.user)
        res = self.entity_create_view(request)

        # The returned values should match the values defined
        # in the test expected response values
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        new_car = Car.objects.get(id=res.data["id"])

        for expected_tag in [
            "MOT_DUE",
            "INSURANCE_DUE",
            "SERVICE_DUE",
            "WARRANTY_DUE",
            "TAX_DUE",
        ]:
            new_task = new_car.tasks.get(hidden_tag=expected_tag)

            self.assertEqual(list(new_task.members.all()), [self.user])
            task_actions = new_task.actions
            self.assertEqual(task_actions.count(), 1)
            action = task_actions.get()
            self.assertEqual(action.action_timedelta, timedelta(days=30))
