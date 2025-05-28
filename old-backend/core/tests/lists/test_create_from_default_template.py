"""List entry viewset tests"""

import logging

import pytz
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.lists import PlanningList
from core.models.users.user_models import Family, User
from core.utils.categories import Categories
from core.views.list_viewsets import create_from_default_template

utc = pytz.UTC


logger = logging.getLogger(__name__)


class TestCreateFromDefaultTemplateView(TestCase):
    """TestCreateFromDefaultTemplateView"""

    def setUp(self):
        self.family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=self.family
        )

    def test_create_from_default_template(self):
        """test_create_from_default_template"""
        new_list_name = "A NEW LIST"

        req = APIRequestFactory().post(
            "", {"list_template": "BEFORE_AFTER_TERM_TIME", "title": new_list_name}
        )
        force_authenticate(req, self.user)
        res = create_from_default_template(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        new_list_id = res.data["id"]
        new_list = PlanningList.objects.get(id=new_list_id)
        self.assertEqual(new_list.name, new_list_name)
        self.assertEqual(list(new_list.members.all()), [self.user])
        self.assertEqual(new_list.category, Categories.EDUCATION.value)
