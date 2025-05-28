import logging
from datetime import timedelta

from django.test import TestCase
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.base import Entity
from core.models.messages.base import Message
from core.models.tasks.base import Task, TaskAction
from core.models.users.user_models import Family, User
from core.serializers.messages import MessageSerializer
from core.utils.categories import Categories
from core.views.message_viewsets import MessageViewset, message_threads

logger = logging.getLogger(__name__)


class TestMessagesViewset(TestCase):
    """Tests for the messages viewset"""

    def setUp(self):
        family = Family.objects.create()
        self.user = User.objects.create(
            username="test@test.test", phone_number="+447123456789", family=family
        )
        self.family_member = User.objects.create(
            username="family@test.test", phone_number="+447123456749", family=family
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

    def test_can_get_messages_threads(self):
        """Test can get messages filtered by entity"""

        Message.objects.create(
            user=self.user, text="Hey there!", entity=self.user_entity
        )
        last_user_entity_message = Message.objects.create(
            user=self.family_member, text="Hello you!", entity=self.user_entity
        )

        Message.objects.create(
            user=self.user, text="Hey there!", entity=self.other_entity
        )
        last_other_entity_message = Message.objects.create(
            user=self.family_member, text="Hello you!", entity=self.other_entity
        )

        Message.objects.create(user=self.user, text="Hey there!", task=self.user_task)
        last_user_task_message = Message.objects.create(
            user=self.family_member, text="Hello you!", task=self.user_task
        )

        Message.objects.create(user=self.user, text="Hey there!", task=self.other_task)
        last_other_task_message = Message.objects.create(
            user=self.family_member, text="Hello you!", task=self.other_task
        )

        Message.objects.create(
            user=self.user, text="Hey there!", action=self.user_task_action
        )
        last_user_action_message = Message.objects.create(
            user=self.family_member, text="Hello you!", action=self.user_task_action
        )

        Message.objects.create(
            user=self.user, text="Hey there!", action=self.other_task_action
        )
        last_other_action_message = Message.objects.create(
            user=self.family_member, text="Hello you!", action=self.other_task_action
        )

        req = APIRequestFactory().get("")
        force_authenticate(req, self.user)

        res = message_threads(req)

        self.assertEqual(
            res.data,
            [
                dict(MessageSerializer(last_other_action_message).data),
                dict(MessageSerializer(last_user_action_message).data),
                dict(MessageSerializer(last_other_task_message).data),
                dict(MessageSerializer(last_user_task_message).data),
                dict(MessageSerializer(last_other_entity_message).data),
                dict(MessageSerializer(last_user_entity_message).data),
            ],
        )
