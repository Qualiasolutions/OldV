import datetime as dt
import logging

import pytz
from dateutil.tz import tzlocal
from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity
from core.models.tasks.base import FixedTask
from core.models.users.user_models import Family, User
from core.views.entity_viewsets import EntityReadonlyViewSet

utc = pytz.UTC


logger = logging.getLogger(__name__)


class TestEntityReadonlyViewSet(TestCase):
    """TestEntityReadonlyViewSet"""

    def setUp(self):
        test_phone = "+447123123123"
        self.family = Family.objects.create()
        self.user = User.objects.create(
            phone_number=test_phone, username=test_phone, family=self.family
        )
        self.list_view = EntityReadonlyViewSet.as_view({"get": "list"})

    def test_can_list_entity_as_task_doer(self):
        """Test a user can list entities that they are not assigned to
        if they are assigned to a task for that entity
        """
        owner_phone = "+447111222333"
        owner = User.objects.create(phone_number=owner_phone, username=owner_phone)
        entity = Entity.objects.create(name="__ENTITY__", category=1, owner=owner)
        task = FixedTask.objects.create(
            title="Test Task",
            start_datetime=dt.datetime.now(tzlocal()),
            end_datetime=dt.datetime.now(tzlocal()),
        )
        task.entities.add(entity)
        task.members.add(self.user)
        task.save()

        req = APIRequestFactory().get("")
        force_authenticate(req, self.user)

        res = self.list_view(req)

        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["id"], entity.id)

    def test_can_list_entity_if_assigned_to_child(self):
        """Test a user can list entities that they are not assigned to
        if they are assigned to a child entity for that entity
        """
        owner_phone = "+447111222333"
        owner = User.objects.create(phone_number=owner_phone, username=owner_phone)
        entity = Entity.objects.create(name="__ENTITY__", category=1, owner=owner)

        other_owner_phone = "+447111222222"
        other_owner = User.objects.create(
            phone_number=other_owner_phone, username=other_owner_phone
        )
        child = Entity.objects.create(
            name="Test Child Entity", category=1, owner=other_owner, parent=entity
        )
        child.members.add(other_owner)

        req = APIRequestFactory().get("")
        force_authenticate(req, other_owner)

        res = self.list_view(req)

        self.assertEqual(len(res.data), 2)
        self.assertEqual(sorted([ent["id"] for ent in res.data]), [entity.id, child.id])

    def test_cannot_list_entity_if_unrelated(self):
        """Test a user can list entities that they are not assigned to
        if they are assigned to a task for that entity
        """
        owner_phone = "+447111222333"
        owner = User.objects.create(
            phone_number=owner_phone, username=owner_phone, family=self.family
        )
        entity = Entity.objects.create(name="__ENTITY__", category=1, owner=owner)
        task = FixedTask.objects.create(
            title="Test Task",
            start_datetime=dt.datetime.now(tzlocal()),
            end_datetime=dt.datetime.now(tzlocal()),
        )
        task.entities.add(entity)
        task.members.add(owner)
        task.save()

        req = APIRequestFactory().get("")
        force_authenticate(req, self.user)

        res = self.list_view(req)

        self.assertEqual(len(res.data), 0)
