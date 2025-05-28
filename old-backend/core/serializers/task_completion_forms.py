"""task completion form serializers"""
import logging

from rest_framework.serializers import ModelSerializer

from core.models.task_completion_forms.base import TaskCompletionForm

logger = logging.getLogger(__name__)


class TaskCompletionFormSerializer(ModelSerializer):
    """TaskCompletionFormSerializer"""

    class Meta:
        model = TaskCompletionForm
        fields = "__all__"
