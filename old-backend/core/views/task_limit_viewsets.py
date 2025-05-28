from rest_framework.permissions import IsAuthenticated
from core.models.tasks.task_limits import TaskLimit
from rest_framework.viewsets import ModelViewSet
from core.serializers.task_limits import TaskLimitSerializer


class TaskLimitViewSet(ModelViewSet):
    """TaskLimitViewSet"""

    serializer_class = TaskLimitSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return (
            TaskLimit.objects.all()
            .filter(user=self.request.user)
            .distinct()
        )
