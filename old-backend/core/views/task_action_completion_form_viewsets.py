"""TaskActionCompletionForm viewsets"""

from typing import cast

from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from core.models.tasks.base import TaskActionCompletionForm
from core.models.users.user_models import User
from core.serializers.task_action_completion_forms import (
    TaskActionCompletionFormSerializer,
)


class TaskActionCompletionFormViewSet(ModelViewSet):
    """TaskActionCompletionFormViewSet"""

    serializer_class = TaskActionCompletionFormSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        if not user.family:
            return []

        family_members = list(user.family.users.all())

        return TaskActionCompletionForm.objects.filter(
            action__task__members__in=family_members
        ).distinct()
