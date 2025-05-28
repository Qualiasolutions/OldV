"""TaskCompletionForm viewsets"""

from typing import cast

from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from core.models.task_completion_forms.base import TaskCompletionForm
from core.models.users.user_models import User
from core.serializers.task_completion_forms import TaskCompletionFormSerializer


class TaskCompletionFormViewSet(ModelViewSet):
    """TaskCompletionFormViewSet"""

    serializer_class = TaskCompletionFormSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_serializer(self, *args, **kwargs):
        if isinstance(kwargs.get("data", {}), list):
            kwargs["many"] = True

        return super().get_serializer(*args, **kwargs)

    def get_queryset(self):
        user = cast(User, self.request.user)
        if not user.family:
            return []

        family_members = list(user.family.users.all())

        return (
            TaskCompletionForm.objects.filter(task__members__in=family_members)
            .distinct()
            .order_by("id")
        )
