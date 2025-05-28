from datetime import timedelta

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity
from core.models.messages.base import Message
from core.models.tasks.base import Task, TaskAction
from core.models.users.user_models import Family, User
from core.utils.categories import Categories
from core.views.message_viewsets import MessageViewset


class TestMessagesViewset(TestCase):
    """Tests for the messages viewset"""

    def setUp(self):
        family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.testttt", phone_number="+447123456781", family=family
        )
        self.family_member = User.objects.create(
            username="family@test.testttt", phone_number="+447123456741", family=family
        )

        self.user_entity = Entity.objects.create(
            name="Test Entity",
            owner=self.user,
            category=Categories.TRANSPORT.value,
        )
        self.user_entity.members.set([self.user, self.family_member])

        self.user_task = Task.objects.create(title="Test Task")
        self.user_task.members.set([self.user, self.family_member])
        self.user_task.entities.set([self.user_entity])

        self.user_task_action = TaskAction.objects.create(
            task=self.user_task, action_timedelta=timedelta(weeks=2)
        )

        self.other_entity = Entity.objects.create(
            name="Other Entity",
            owner=self.user,
            category=Categories.TRANSPORT.value,
        )
        self.other_entity.members.set([self.user, self.family_member])

        self.other_task = Task.objects.create(title="Other Task")
        self.other_task.members.set([self.user, self.family_member])
        self.other_task.entities.set([self.other_entity])

        self.other_task_action = TaskAction.objects.create(
            task=self.other_task, action_timedelta=timedelta(weeks=2)
        )

        self.list_messages_view = MessageViewset.as_view({"get": "list"})

    def test_can_get_messages_for_entity(self):
        """Test can get messages filtered by entity"""

        req = APIRequestFactory().get("", {"entity": self.user_entity.id})
        force_authenticate(req, self.user)

        Message.objects.create(
            user=self.user, text="Hey there!", entity=self.user_entity
        )
        Message.objects.create(
            user=self.family_member, text="Hello you!", entity=self.user_entity
        )

        Message.objects.create(
            user=self.user, text="Hey there!", entity=self.other_entity
        )
        Message.objects.create(
            user=self.family_member, text="Hello you!", entity=self.other_entity
        )

        res = self.list_messages_view(req)

        self.assertEqual(len(res.data), 2)

    def test_can_get_messages_for_task(self):
        """Test can get messages filtered by task"""

        Message.objects.create(user=self.user, text="Hey there!", task=self.user_task)
        Message.objects.create(
            user=self.family_member, text="Hello you!", task=self.user_task
        )

        Message.objects.create(user=self.user, text="Hey there!", task=self.other_task)
        Message.objects.create(
            user=self.family_member, text="Hello you!", task=self.other_task
        )

        req = APIRequestFactory().get("", {"task": self.user_task.id})
        force_authenticate(req, self.user)
        res = self.list_messages_view(req)

        self.assertEqual(len(res.data), 2)

    def test_can_get_messages_for_action(self):
        """Test can get messages filtered by action"""

        req = APIRequestFactory().get("", {"action": self.user_task_action.id})
        force_authenticate(req, self.user)

        Message.objects.create(
            user=self.user, text="Hey there!", action=self.user_task_action
        )
        Message.objects.create(
            user=self.family_member, text="Hello you!", action=self.user_task_action
        )

        Message.objects.create(
            user=self.user, text="Hey there!", action=self.other_task_action
        )
        Message.objects.create(
            user=self.family_member,
            text="Hello you!",
            action=self.other_task_action,
        )

        res = self.list_messages_view(req)

        self.assertEqual(len(res.data), 2)

    def test_can_get_messages_for_specific_occurrence(self):
        """Test can get messages filtered by recurrence_index"""

        Message.objects.create(
            user=self.user, text="Hey there!", task=self.user_task, recurrence_index=3
        )
        Message.objects.create(
            user=self.family_member,
            text="Hello you!",
            task=self.user_task,
            recurrence_index=3,
        )

        Message.objects.create(
            user=self.user, text="Hey there!", task=self.user_task, recurrence_index=2
        )
        Message.objects.create(
            user=self.family_member,
            text="Hello you!",
            task=self.user_task,
            recurrence_index=2,
        )

        req = APIRequestFactory().get(
            "", {"task": self.user_task.id, "recurrence_index": 3}
        )
        force_authenticate(req, self.user)

        res = self.list_messages_view(req)

        self.assertEqual(len(res.data), 2)
