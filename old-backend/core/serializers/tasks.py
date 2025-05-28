"""task serializers"""

import logging
from datetime import datetime
from typing import cast

from django.forms.models import model_to_dict
from rest_framework import serializers
from rest_framework.serializers import (
    BooleanField,
    CharField,
    DateField,
    DateTimeField,
    IntegerField,
    JSONField,
    ModelSerializer,
    PrimaryKeyRelatedField,
    Serializer,
    SerializerMethodField,
    ValidationError,
)
from rest_framework.validators import UniqueTogetherValidator
from rest_polymorphic.serializers import PolymorphicSerializer  # type: ignore
from timezone_field.rest_framework import TimeZoneSerializerField  # type: ignore

from core.models.entities.base import Entity
from core.models.routines.routines import Routine
from core.models.tasks.alerts import ALERT_TYPES, ActionAlert, Alert
from core.models.tasks.anniversaries import AnniversaryTask, BirthdayTask
from core.models.tasks.base import (
    FixedTask,
    FlexibleTask,
    Recurrence,
    RecurrentTaskOverwrite,
    Task,
    TaskAction,
    TaskReminder,
)
from core.models.tasks.holidays import HolidayTask
from core.models.tasks.travel import AccommodationTask, TransportTask
from core.models.users.user_models import User
from core.serializers.mixins.task_entities import WithEntitiesSerializerMixin
from core.utils.scheduling.scheduler import SchedulingEngine
from external_calendars.models import ICalEvent

from .mixins.members import WithMembersSerializerMixin

logger = logging.getLogger(__name__)


class RecurrenceSerializer(ModelSerializer):
    """RecurrenceSerializer"""

    # Recurrences are only created via the task viewset
    # which overrides the create method and sets the task
    # as appropriate, so we set it to not be required here
    task: PrimaryKeyRelatedField = PrimaryKeyRelatedField(
        queryset=Task.objects.all(), required=False
    )

    class Meta:
        model = Recurrence
        fields = "__all__"


class TaskReminderSerializer(ModelSerializer):
    """TaskReminderSerializer"""

    # Reminders are only created via the task viewset
    # which overrides the create method and sets the task
    # as appropriate, so we set it to not be required here
    task: PrimaryKeyRelatedField = PrimaryKeyRelatedField(
        queryset=Task.objects.all(), required=False
    )

    class Meta:
        model = TaskReminder
        fields = "__all__"


class TaskActionSerializer(ModelSerializer):
    """TaskActionSerializer"""

    # Reminders are only created via the task viewset
    # which overrides the create method and sets the task
    # as appropriate, so we set it to not be required here
    task: PrimaryKeyRelatedField = PrimaryKeyRelatedField(
        queryset=Task.objects.all(), required=False
    )

    class Meta:
        model = TaskAction
        fields = "__all__"


class TaskBaseSerializer(
    WithMembersSerializerMixin, WithEntitiesSerializerMixin, ModelSerializer
):
    """TaskBaseSerializer"""

    recurrence = RecurrenceSerializer(required=False, allow_null=True)
    reminders = TaskReminderSerializer(required=False, allow_null=True, many=True)
    actions = TaskActionSerializer(required=False, allow_null=True, many=True)

    members: PrimaryKeyRelatedField = PrimaryKeyRelatedField(
        queryset=User.objects.all(), many=True, required=True
    )
    entities: PrimaryKeyRelatedField = PrimaryKeyRelatedField(
        queryset=Entity.objects.all(), many=True, required=False
    )
    routine: PrimaryKeyRelatedField = PrimaryKeyRelatedField(
        queryset=Routine.objects.all(), many=False, required=False, allow_null=True
    )

    class Meta:
        model = Task
        fields = "__all__"

    def create_alerts(self, validated_data, task: Task):
        """Create alerts for the task and validated data provided"""
        categories = list(set([e.category for e in task.entities.all()]))

        # Initialize the scheduling engine
        engine = SchedulingEngine(self._user)

        # Schedule existing tasks
        engine.schedule_tasks()

        # Remove the task that we are currently updating
        engine.unschedule_task(task.id)

        for block_type in ALERT_TYPES:
            alerted_users = engine.get_alerted_users(
                block_type,
                categories,
                list(task.members.all()),
                start_time=validated_data.get("start_datetime"),
                end_time=validated_data.get("end_datetime"),
                start_date=validated_data.get("start_date"),
                end_date=validated_data.get("end_date"),
                date=validated_data.get("date"),
            )

            for user in alerted_users:
                Alert.objects.create(type=block_type, user=user, task=task)

            for action in list(task.actions.all()):
                start_datetime = (
                    validated_data["start_datetime"] - action.action_timedelta
                    if validated_data.get("start_datetime")
                    else None
                )
                end_datetime = (
                    validated_data["end_datetime"] - action.action_timedelta
                    if validated_data.get("end_datetime")
                    else None
                )
                date = (
                    validated_data["date"] - action.action_timedelta
                    if validated_data.get("date")
                    else None
                )

                alerted_users = engine.get_alerted_users(
                    block_type,
                    categories,
                    list(task.members.all()),
                    start_datetime,
                    end_datetime,
                    date,
                )

                for user in alerted_users:
                    ActionAlert.objects.create(
                        type=block_type, user=user, action=action
                    )

    def validate_recurrence(self, value):
        """validate_recurrence"""
        if self.instance and hasattr(self.instance, "recurrence"):
            raise ValidationError(
                "Cannot update recurrence for existing recurring task"
            )

        return value

    def create(self, validated_data):
        recurrence_data = validated_data.pop("recurrence", None)
        reminders_data = validated_data.pop("reminders", None)
        actions_data = validated_data.pop("actions", None)

        task = super().create(validated_data)

        if recurrence_data:
            if recurrence_data.get("task"):
                del recurrence_data["task"]

            Recurrence.objects.create(task=task, **recurrence_data)

        if reminders_data:
            for reminder in reminders_data:
                TaskReminder.objects.create(task=task, **reminder)

        if actions_data:
            for action in actions_data:
                if action.get("task"):
                    del action["task"]
                TaskAction.objects.create(task=task, **action)

        if not recurrence_data:
            self.create_alerts(validated_data, task)

        return task

    def update(self, instance, validated_data, *args, **kwargs):
        reminders_data = validated_data.pop("reminders", None)
        actions_data = validated_data.pop("actions", None)
        recurrence_data = validated_data.pop("recurrence", None)
        task = super().update(instance, validated_data, *args, **kwargs)

        if recurrence_data:
            if not hasattr(instance, "recurrence"):
                Recurrence.objects.create(task=task, **recurrence_data)

        if reminders_data:
            instance.reminders.all().delete()
            for reminder in reminders_data:
                TaskReminder.objects.create(**{**reminder, "task": task})

        if actions_data:
            current_actions = list(instance.actions.all())

            old_actions = []
            for action in current_actions:
                matching_actions = [
                    act
                    for act in actions_data
                    if act["action_timedelta"] == action.action_timedelta
                ]
                if matching_actions:
                    old_actions += matching_actions
                else:
                    action.delete()

            new_actions = [act for act in actions_data if not act in old_actions]
            for action in new_actions:
                TaskAction.objects.create(task=task, **action)

        if (
            validated_data.get("start_datetime")
            or validated_data.get("end_datetime")
            or validated_data.get("start_date")
            or validated_data.get("end_date")
            or validated_data.get("date")
            or actions_data
        ):
            # Delete old alerts when the time is updated
            instance.alerts.all().delete()
            for action in list(instance.actions.all()):
                action.action_alerts.all().delete()

            if not recurrence_data and not hasattr(instance, "recurrence"):
                task.refresh_from_db()
                self.create_alerts(validated_data, task)

        return task


class FixedTaskSerializer(TaskBaseSerializer):
    """FixedTaskSerializer"""

    start_timezone = TimeZoneSerializerField(
        use_pytz=False, required=False, allow_null=True
    )
    end_timezone = TimeZoneSerializerField(
        use_pytz=False, required=False, allow_null=True
    )

    class Meta:
        model = FixedTask
        fields = "__all__"

    def cannot_change_if_recurrent_validation(self, value, field_name):
        """cannot_change_if_recurrent_validation"""
        if (
            self.instance
            and hasattr(self.instance, "recurrence")
            and value != getattr(self.instance, field_name)
        ):
            raise ValidationError(
                {
                    field_name: f"Cannot update {field_name} of a task with recurrence - update the specific instance if required."
                }
            )
        return value

    def validate_start_datetime(self, value):
        """validate_start_datetime"""
        return self.cannot_change_if_recurrent_validation(value, "start_datetime")

    def validate_end_datetime(self, value):
        """validate_end_datetime"""
        return self.cannot_change_if_recurrent_validation(value, "end_datetime")

    def validate(self, attrs, *args, **kwargs):
        """Validation"""
        if not self.instance:
            has_fixed_fields = attrs.get("start_datetime") and attrs.get("end_datetime")
            has_any_fixed_fields = attrs.get("start_datetime") or attrs.get(
                "end_datetime"
            )

            has_anytime_fields = attrs.get("duration") and attrs.get("date")
            has_any_anytime_fields = attrs.get("duration") or attrs.get("date")

            has_date_only_fields = attrs.get("start_date") and attrs.get("end_date")
            has_any_date_only_fields = attrs.get("start_date") or attrs.get("end_date")

            num_types = len(
                [
                    has
                    for has in [
                        has_any_fixed_fields,
                        has_any_anytime_fields,
                        has_any_date_only_fields,
                    ]
                    if has
                ]
            )

            if num_types > 1:
                error_message = "Should only have one of fixed times, start and end dates, and date and duration"
                raise ValidationError(
                    {
                        "start_datetime": error_message,
                        "end_datetime": error_message,
                        "duration": error_message,
                        "date": error_message,
                    }
                )
            if (
                not has_fixed_fields
                and not has_anytime_fields
                and not has_date_only_fields
            ):
                error_message = "Requires either fixed times or date"
                raise ValidationError(
                    {
                        "start_datetime": error_message,
                        "end_datetime": error_message,
                        "duration": error_message,
                        "date": error_message,
                    }
                )

        if attrs.get("start_datetime") and attrs.get("start_timezone"):
            start_datetime = cast(datetime, attrs["start_datetime"])
            attrs["start_datetime"] = start_datetime.replace(
                tzinfo=attrs.get("start_timezone")
            )

        if attrs.get("end_datetime") and attrs.get("end_timezone"):
            end_datetime = cast(datetime, attrs["end_datetime"])
            attrs["end_datetime"] = end_datetime.replace(
                tzinfo=attrs.get("end_timezone")
            )

        if attrs.get("start_datetime") and attrs.get("end_datetime"):
            if attrs.get("end_datetime") < attrs.get("start_datetime"):
                error_message = "start datetime must be before end datetime"
                raise ValidationError(
                    {
                        "start_datetime": error_message,
                        "end_datetime": error_message,
                        "duration": error_message,
                        "date": error_message,
                    }
                )

        return super().validate(attrs, *args, **kwargs)

    def update(self, instance, validated_data, *args, **kwargs):
        """Make sure that we only use one of fixed and anytime fields"""
        has_fixed_fields = validated_data.get("start_datetime") and validated_data.get(
            "end_datetime"
        )
        has_anytime_fields = validated_data.get("duration") and validated_data.get(
            "date"
        )

        has_date_only_fields = validated_data.get("start_date") and validated_data.get(
            "end_date"
        )

        if has_fixed_fields:
            validated_data["duration"] = None
            validated_data["date"] = None
            validated_data["start_date"] = None
            validated_data["end_date"] = None

        if has_anytime_fields:
            validated_data["start_datetime"] = None
            validated_data["end_datetime"] = None
            validated_data["start_date"] = None
            validated_data["end_date"] = None

        if has_date_only_fields:
            validated_data["duration"] = None
            validated_data["date"] = None
            validated_data["start_datetime"] = None
            validated_data["end_datetime"] = None

        return super().update(instance, validated_data, *args, **kwargs)


class TransportTaskSerializer(FixedTaskSerializer):
    """TransportTaskSerializer"""

    class Meta:
        model = TransportTask
        fields = "__all__"

    def update(self, instance, validated_data, *args, **kwargs):
        validated_data["title"] = (
            f"{validated_data['type']} {validated_data['start_location']} -> {validated_data['end_location']}"
        )
        return super().update(instance, validated_data, *args, **kwargs)

    def create(self, validated_data, *args, **kwargs):
        validated_data["title"] = (
            f"{validated_data['type']} {validated_data['start_location']} -> {validated_data['end_location']}"
        )
        return super().create(validated_data, *args, **kwargs)


class AnniversaryTaskSerializer(FixedTaskSerializer):
    """AnniversaryTaskSerializer"""

    class Meta:
        model = AnniversaryTask
        fields = "__all__"


class HolidayTaskSerializer(FixedTaskSerializer):
    """HolidayTaskSerializer"""

    class Meta:
        model = HolidayTask
        fields = "__all__"


class HolidayTaskWriteOnlySerializer(
    WithMembersSerializerMixin, WithEntitiesSerializerMixin, ModelSerializer
):
    """HolidayTaskWriteOnlySerializer"""

    members: PrimaryKeyRelatedField = PrimaryKeyRelatedField(
        queryset=User.objects.all(), many=True, required=False, write_only=True
    )

    class Meta:
        model = HolidayTask
        exclude = ["polymorphic_ctype"]


class BirthdayTaskSerializer(FixedTaskSerializer):
    """BirthdayTaskSerializer"""

    class Meta:
        model = BirthdayTask
        fields = "__all__"

    def update(self, instance, validated_data, *args, **kwargs):
        title = validated_data["first_name"]
        if validated_data.get("last_name"):
            title += f" {validated_data['last_name']}"
        title += "'s Birthday"

        validated_data["title"] = title
        return super().update(instance, validated_data, *args, **kwargs)

    def create(self, validated_data, *args, **kwargs):
        title = validated_data["first_name"]
        if validated_data.get("last_name"):
            title += f" {validated_data['last_name']}"
        title += "'s Birthday"

        validated_data["title"] = title
        return super().create(validated_data, *args, **kwargs)


class AccommodationTaskSerializer(FixedTaskSerializer):
    """AccommodationTaskSerializer"""

    class Meta:
        model = AccommodationTask
        fields = "__all__"

    def update(self, instance, validated_data, *args, **kwargs):
        validated_data["title"] = f"Stay - {validated_data['accommodation_name']}"
        return super().update(instance, validated_data, *args, **kwargs)

    def create(self, validated_data, *args, **kwargs):
        validated_data["title"] = f"Stay - {validated_data['accommodation_name']}"
        return super().create(validated_data, *args, **kwargs)


class FlexibleFixedTaskSerializer(TaskBaseSerializer):
    """Serializer to provide flexible task fields (earliest_action_date,
    due_date, duration) but simply schedule and create a
    fixed task immediately, rather than creating an actual flexible task.
    """

    # Override these fields to make them un-required
    start_datetime = DateTimeField(required=False)
    end_datetime = DateTimeField(required=False)

    earliest_action_date = serializers.DateTimeField(write_only=True)
    due_date = serializers.DateTimeField(write_only=True)
    duration = serializers.IntegerField(write_only=True)

    class Meta:
        model = FixedTask
        fields = "__all__"

    @property
    def _user(self):
        req = self.context.get("request")
        if req:
            return req.user

    def create(self, validated_data):
        """Schedule and create a fixed task based on
        the values provided.
        """

        categories = [e.category for e in validated_data["entities"]]
        entities = [e.id for e in validated_data["entities"]]
        members = [m.id for m in validated_data["members"]]
        routine = validated_data.get("routine", None)

        # Initialize the scheduling engine
        engine = SchedulingEngine(self._user)

        # Schedule existing tasks
        engine.schedule_tasks()

        task_placement = engine.get_task_placement(
            validated_data.pop("earliest_action_date"),
            validated_data.pop("due_date"),
            validated_data.pop("duration"),
            categories,
            validated_data["members"],
            routine,
        )

        serializer = FixedTaskSerializer(
            data={
                **validated_data,
                **task_placement,
                "entities": entities,
                "members": members,
                "routine": routine.id if routine else None,
            },
            context=self.context,
        )
        serializer.is_valid(raise_exception=True)
        task = serializer.save()

        return task


class FlexibleTaskSerializer(TaskBaseSerializer):
    """FlexibleTaskSerializer"""

    class Meta:
        model = FlexibleTask
        fields = "__all__"


class ICalEventSerializer(FixedTaskSerializer):
    """ICalEventSerializer"""

    title = SerializerMethodField(read_only=True)

    class Meta:
        model = ICalEvent
        fields = "__all__"

    def get_title(self, instance):
        """get_title"""
        if (instance.ical_integration.user == self._user) or (
            instance.ical_integration.share_type == "FULL"
        ):
            return instance.title

        return "BUSY"


class TaskSerializer(PolymorphicSerializer):
    """TaskSerializer"""

    base_serializer_class = TaskBaseSerializer
    model_serializer_mapping = {
        FixedTask: FixedTaskSerializer,
        TransportTask: TransportTaskSerializer,
        AccommodationTask: AccommodationTaskSerializer,
        FlexibleTask: FlexibleTaskSerializer,
        Task: TaskBaseSerializer,
        AnniversaryTask: AnniversaryTaskSerializer,
        BirthdayTask: BirthdayTaskSerializer,
        HolidayTask: HolidayTaskSerializer,
        ICalEvent: ICalEventSerializer,
    }

    class Meta:
        ref_name = "TaskPolymorphicSerializer"


class RecurrentTaskOverwriteSerializer(ModelSerializer):
    """RecurrentTaskOverwriteSerializer"""

    task = FixedTaskSerializer(allow_null=True)

    class Meta:
        model = RecurrentTaskOverwrite
        fields = "__all__"
        validators = [
            UniqueTogetherValidator(
                queryset=model.objects.all(), fields=("recurrence", "recurrence_index")
            )
        ]

    def to_internal_value(self, data):
        base_task_obj = Recurrence.objects.get(pk=data["recurrence"]).task
        base_task = model_to_dict(base_task_obj)
        del base_task["id"]

        new_task = {**base_task, **data["task"]} if data.get("task") else None

        if new_task and (
            not new_task["resourcetype"] == base_task_obj.__class__.__name__
        ):
            raise ValidationError({"resourcetype": "resourcetype must match base task"})

        if new_task and (not data["task"].get("entities")):
            new_task["entities"] = [ent.id for ent in new_task["entities"]]

        if new_task and (not data["task"].get("members")):
            new_task["members"] = [member.id for member in new_task["members"]]

        return super().to_internal_value(
            {
                "task": new_task,
                "recurrence": data["recurrence"],
                "recurrence_index": data["recurrence_index"],
            }
        )

    def create(self, validated_data):
        if validated_data["task"]:
            serializer = FixedTaskSerializer(
                data={
                    **validated_data["task"],
                    "entities": [ent.id for ent in validated_data["task"]["entities"]],
                    "members": [
                        member.id for member in validated_data["task"]["members"]
                    ],
                    "routine": (
                        validated_data["routine"].id
                        if validated_data.get("routine")
                        else None
                    ),
                    "recurrence": None,
                },
                context=self.context,
            )
            serializer.is_valid(raise_exception=True)
            task = serializer.save()
        else:
            task = None

        recurrence = validated_data["recurrence"]
        return RecurrentTaskOverwrite.objects.create(
            task=task,
            recurrence=recurrence,
            recurrence_index=validated_data["recurrence_index"],
        )


class ScheduledTaskSerializer(Serializer):
    """Used to serialize tasks that have been placed
    at a specific start and end time.
    """

    id = IntegerField(read_only=True)
    title = CharField(read_only=True)

    is_complete = BooleanField(read_only=True)
    is_partially_complete = BooleanField(read_only=True)
    is_ignored = BooleanField(read_only=True)
    recurrence = IntegerField(read_only=True)

    members = JSONField()
    entities = JSONField()
    tags = JSONField()

    start_datetime = DateTimeField(read_only=True)
    end_datetime = DateTimeField(read_only=True)

    date = DateField(read_only=True)
    duration = IntegerField(read_only=True)

    start_date = DateField(read_only=True)
    end_date = DateField(read_only=True)

    recurrence_index = IntegerField(read_only=True)
    resourcetype = CharField(read_only=True)
    type = CharField(read_only=True)

    routine = IntegerField(read_only=True)

    action_id = IntegerField(read_only=True)


class ScheduledEntitySerializer(Serializer):
    """Used to serialize entities that have been placed"""

    id = IntegerField(read_only=True)
    members = JSONField()

    start_date = DateField(read_only=True)
    end_date = DateField(read_only=True)

    start_datetime = DateTimeField(read_only=True)
    end_datetime = DateTimeField(read_only=True)

    title = CharField(read_only=True)
    resourcetype = CharField(read_only=True)

    recurrence_index = IntegerField(read_only=True)
