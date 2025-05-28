from rest_framework.serializers import ModelSerializer, ValidationError
from core.models.tasks.task_limits import TaskLimit
from core.serializers.mixins.validate_user import ValidateUserMixin
from core.utils.categories import Categories


class TaskLimitSerializer(ValidateUserMixin, ModelSerializer):
    class Meta:
        model = TaskLimit
        fields = "__all__"

    def validate_category(self, value):
        if not value in [e.value for e in Categories]:
            raise ValidationError({
                "message": "Invalid Category",
                "code": "invalid_category"
            })
        return value
