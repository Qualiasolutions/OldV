"""task action completion form serializers"""
import logging

from rest_framework.serializers import ModelSerializer, ValidationError

from core.models.tasks.base import TaskActionCompletionForm

logger = logging.getLogger(__name__)


class TaskActionCompletionFormSerializer(ModelSerializer):
    """TaskActionCompletionFormSerializer"""

    class Meta:
        model = TaskActionCompletionForm
        fields = "__all__"
        unique_together = ("action", "recurrence_index")
