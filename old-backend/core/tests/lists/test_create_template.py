"""List entry viewset tests"""

import logging

import pytz
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.lists import PlanningList, PlanningListItem, PlanningSublist
from core.models.users.user_models import Family, User
from core.views.list_viewsets import create_template

utc = pytz.UTC


logger = logging.getLogger(__name__)


class TestCreateTemplateView(TestCase):
    """TestCreateTemplateView"""

    def setUp(self):
        self.family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=self.family
        )
        self.list = PlanningList.objects.create(category=1, name="A_LIST")
        self.list.members.set([self.user])

        self.sublist = PlanningSublist.objects.create(list=self.list, title="SUBLIST")
        self.list_item = PlanningListItem.objects.create(
            sublist=self.sublist, title="LIST ITEM"
        )

    def test_create_template(self):
        """test_create_template"""
        new_template_name = "A NEW TEMPLATE"
        req = APIRequestFactory().post(
            "", {"list": self.list.id, "title": new_template_name}
        )
        force_authenticate(req, self.user)
        res = create_template(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        new_template_id = res.data["id"]
        new_template = PlanningList.objects.get(id=new_template_id)
        self.assertEqual(new_template.name, new_template_name)
        self.assertEqual(list(new_template.members.all()), [self.user])
        self.assertEqual(
            [sublist.title for sublist in new_template.sublists.all()],
            [self.sublist.title],
        )

    def test_create_from_template(self):
        """test_create_template"""
        new_list_name = "A NEW LIST"
        self.list.is_template = True
        self.list.save()

        req = APIRequestFactory().post(
            "", {"list": self.list.id, "title": new_list_name, "from_template": True}
        )
        force_authenticate(req, self.user)
        res = create_template(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        new_template_id = res.data["id"]
        new_template = PlanningList.objects.get(id=new_template_id)
        self.assertEqual(new_template.name, new_list_name)
        self.assertEqual(list(new_template.members.all()), [self.user])
        self.assertEqual(
            [sublist.title for sublist in new_template.sublists.all()],
            [self.sublist.title],
        )
