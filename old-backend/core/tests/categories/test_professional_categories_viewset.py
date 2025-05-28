"""Test professional categories viewset"""

import logging

import pytz
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.users.user_models import Family, User
from core.views.category_viewsets import ProfessionalCategoriesViewset

utc = pytz.UTC


logger = logging.getLogger(__name__)


class TestCreateProfessionalCategories(TestCase):
    """TestCreateProfessionalCategories"""

    def setUp(self):
        family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=family
        )
        self.category_create_view = ProfessionalCategoriesViewset.as_view(
            {"post": "create"}
        )

    def test_create_for_self(self):
        """test_create_for_self"""

        req = APIRequestFactory().post(
            "", {"user": self.user.id, "name": "MY NEW CATEGORY"}
        )

        force_authenticate(req, self.user)

        res = self.category_create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_cannot_create_for_other(self):
        """test_cannot_create_for_other"""

        other_user = User.objects.create(
            phone_number="+447123123123", username="+447123123123"
        )
        req = APIRequestFactory().post(
            "", {"user": other_user.id, "name": "MY NEW CATEGORY"}
        )

        force_authenticate(req, self.user)

        res = self.category_create_view(req)

        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
