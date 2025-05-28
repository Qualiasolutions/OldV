"""Transport serializers"""
import logging
from typing import List, TypedDict

from rest_framework.serializers import CharField, DateField, PrimaryKeyRelatedField

from core.models.entities.transport import Boat, Car, PublicTransport
from core.models.tasks.base import FixedTask, HiddenTagType, TaskAction
from core.models.users.user_models import User

from .base import EntityBaseSerializer

logger = logging.getLogger(__name__)


class DueDateSettings(TypedDict):
    """DueDateSettings"""

    reminder_interval_field: str
    due_date_field: str
    due_date_members_field: str
    due_date_name: str
    hidden_tag: HiddenTagType


class TransportDueDatesSerializer(EntityBaseSerializer):
    """TransportDueDatesSerializer"""

    mot_due_date = DateField(required=False)
    tax_due_date = DateField(required=False)
    warranty_due_date = DateField(required=False)
    service_due_date = DateField(required=False)
    insurance_due_date = DateField(required=False)

    mot_reminder_interval = CharField(required=False)
    tax_reminder_interval = CharField(required=False)
    insurance_reminder_interval = CharField(required=False)
    service_reminder_interval = CharField(required=False)
    warranty_reminder_interval = CharField(required=False)

    mot_due_date_members = PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )
    tax_due_date_members = PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )
    service_due_date_members = PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )
    insurance_due_date_members = PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )
    warranty_due_date_members = PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        many=True,
        required=False,
        write_only=True,
    )

    due_date_settings: List[DueDateSettings] = [
        {
            "reminder_interval_field": "mot_reminder_interval",
            "due_date_field": "mot_due_date",
            "due_date_members_field": "mot_due_date_members",
            "due_date_name": "MOT",
            "hidden_tag": "MOT_DUE",
        },
        {
            "reminder_interval_field": "tax_reminder_interval",
            "due_date_field": "tax_due_date",
            "due_date_members_field": "tax_due_date_members",
            "due_date_name": "Tax Due",
            "hidden_tag": "TAX_DUE",
        },
        {
            "reminder_interval_field": "service_reminder_interval",
            "due_date_field": "service_due_date",
            "due_date_members_field": "service_due_date_members",
            "due_date_name": "Service Due",
            "hidden_tag": "SERVICE_DUE",
        },
        {
            "reminder_interval_field": "insurance_reminder_interval",
            "due_date_field": "insurance_due_date",
            "due_date_members_field": "insurance_due_date_members",
            "due_date_name": "Insurance Due",
            "hidden_tag": "INSURANCE_DUE",
        },
        {
            "reminder_interval_field": "warranty_reminder_interval",
            "due_date_field": "warranty_due_date",
            "due_date_members_field": "warranty_due_date_members",
            "due_date_name": "Warranty Due",
            "hidden_tag": "WARRANTY_DUE",
        },
    ]

    # def validate_mot_due_date_members(self, value):
    #     """validate_mot_due_date_members"""
    #     return self.validate_members(value)

    # def validate_tax_due_date_members(self, value):
    #     """validate_tax_due_date_members"""
    #     return self.validate_members(value)

    # def validate_service_due_date_members(self, value):
    #     """validate_service_due_date_members"""
    #     return self.validate_members(value)

    # def validate_insurance_due_date_members(self, value):
    #     """validate_insurance_due_date_members"""
    #     return self.validate_members(value)

    # def validate_warranty_due_date_members(self, value):
    #     """validate_warranty_due_date_members"""
    #     return self.validate_members(value)

    def create(self, validated_data):
        popped_vals = {}
        for settings in self.due_date_settings:
            due_date_field = settings["due_date_field"]
            popped_vals[due_date_field] = validated_data.pop(due_date_field, None)
            reminder_interval_field = settings["reminder_interval_field"]
            popped_vals[reminder_interval_field] = validated_data.pop(
                reminder_interval_field, None
            )
            due_date_members_field = settings["due_date_members_field"]
            popped_vals[due_date_members_field] = validated_data.pop(
                due_date_members_field, None
            )

        res = super().create(validated_data)

        for settings in self.due_date_settings:
            reminder_interval_field = settings["reminder_interval_field"]
            due_date_field = settings["due_date_field"]
            due_date_members_field = settings["due_date_members_field"]

            due_date = popped_vals[due_date_field]
            reminder_interval = popped_vals[reminder_interval_field]
            task_members = popped_vals[due_date_members_field]
            if due_date:
                due_date = popped_vals[due_date_field]

                task = FixedTask.objects.create(
                    title=settings["due_date_name"],
                    date=due_date,
                    duration=15,
                    hidden_tag=settings["hidden_tag"],
                    type="DUE_DATE",
                )
                task.entities.add(res)

                if task_members:
                    task.members.set(task_members)

                task.save()

                if reminder_interval:
                    reminder_interval_mappings = {
                        "MONTHLY": "30 days, 00:00:00",
                        "WEEKLY": "7 days, 00:00:00",
                        "DAILY": "1 days, 12:00:00",
                    }
                    TaskAction.objects.create(
                        action_timedelta=reminder_interval_mappings[reminder_interval],
                        task=task,
                    )

        return res


class CarSerializer(TransportDueDatesSerializer):
    """CarSerializer"""

    class Meta:
        model = Car
        fields = "__all__"
        read_only_fields = ("category",)


class BoatSerializer(TransportDueDatesSerializer):
    """BoatSerializer"""

    class Meta:
        model = Boat
        fields = "__all__"
        read_only_fields = ("category",)


class PublicTransportSerializer(EntityBaseSerializer):
    """PublicTransportSerializer"""

    class Meta:
        model = PublicTransport
        fields = "__all__"
        read_only_fields = ("category",)
