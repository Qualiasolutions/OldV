"""Task viewsets"""
import logging
import operator
from functools import reduce
from typing import cast

from dateutil import parser
from django.db.models import Q
from django.forms import model_to_dict
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import GenericViewSet, ModelViewSet, ViewSet

from core.models.settings.family_visibility import FamilyCategoryViewPermission
from core.models.tasks.base import Recurrence, RecurrentTaskOverwrite, Task, TaskAction
from core.models.users.user_models import User
from core.serializers.tasks import (
    FlexibleFixedTaskSerializer,
    HolidayTaskWriteOnlySerializer,
    RecurrentTaskOverwriteSerializer,
    ScheduledEntitySerializer,
    ScheduledTaskSerializer,
    TaskActionSerializer,
    TaskSerializer,
)
from core.utils.scheduling.scheduler import SchedulingEngine
from external_calendars.models import ICalIntegration

# from silk.profiling.profiler import silk_profile  # type: ignore


logger = logging.getLogger(__name__)


class TaskViewSet(ModelViewSet):
    """TaskViewSet"""

    serializer_class = TaskSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        family = user.family

        task_filter = Q(entities__members=self.request.user) | Q(
            members=self.request.user
        )

        if self.request.method == "GET" and family:
            family_category_view_permissions = (
                FamilyCategoryViewPermission.objects.filter(user__in=family.users.all())
            )

            if family_category_view_permissions:
                task_filter |= Q(type="APPOINTMENT") & reduce(
                    operator.or_,
                    (
                        Q(members=perm.user, entities__category=perm.category)
                        for perm in family_category_view_permissions
                    ),
                )

            family_ical_integrations = ICalIntegration.objects.filter(
                user__in=family.users.all(), share_type__in=["FULL", "BUSY"]
            )

            if family_ical_integrations:
                shared_ical_events = []
                for integration in list(family_ical_integrations):
                    shared_ical_events += [
                        event.id for event in list(integration.ical_events.all())
                    ]

                task_filter |= Q(id__in=shared_ical_events)

        return (
            Task.objects.prefetch_related(
                "members",
                "entities",
                "routine",
                "reminders",
                "actions",
                "completion_form",
                "recurrence",
            )
            .filter(task_filter)
            .distinct()
        )

    # @silk_profile(name="List scheduled tasks")
    def list(self, *args, **kwargs):
        return super().list(*args, **kwargs)

    def delete(self, request, pk=None):
        """Delete one or multiple tasks"""
        pk_ids = request.data.get("pk_ids", None)
        if pk_ids:
            for i in pk_ids:
                get_object_or_404(Task, pk=int(i)).delete()
        else:
            get_object_or_404(Task, pk=pk).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class FlexibleFixedTaskViewSet(CreateModelMixin, GenericViewSet):
    """FlexibleFixedTaskViewSet

    Create a fixed task based on flexible task parameters - earliest_action_date,
    due_date, and duration
    """

    serializer_class = FlexibleFixedTaskSerializer
    permission_classes = [
        IsAuthenticated,
    ]


class RecurrentTaskOverwriteViewSet(ModelViewSet):
    """RecurrentTaskOverwriteViewSet"""

    http_method_names = ["post", "delete"]
    serializer_class = RecurrentTaskOverwriteSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return RecurrentTaskOverwrite.objects.filter(task__entities__owner=user)


class RecurrentTaskUpdateAfterViewSet(ViewSet):
    """RecurrentTaskUpdateAfterViewSet"""

    permission_classes = [
        IsAuthenticated,
    ]

    def create(self, request):
        """This is the endpoint used to update all occurrences of a recurring task
        after a given point.

        This is a two-stage process:

        - Update the existing recurrence to end at the specified point
        - Create a new recurring task starting from the specified point
        """
        user = cast(User, self.request.user)
        recurrence = (
            Recurrence.objects.filter(
                Q(task__entities__owner=user)
                | Q(task__entities__members=user)
                | Q(task__members=user)
            )
            .distinct()
            .get(pk=request.data.get("recurrence"))
        )
        new_task_dict = request.data.get("task")

        change_datetime = (
            parser.parse(request.data.get("change_datetime"))
            if request.data.get("change_datetime")
            else (
                parser.parse(new_task_dict["start_datetime"])
                if new_task_dict and new_task_dict.get("start_datetime")
                else (
                    parser.parse(new_task_dict["start_date"])
                    if new_task_dict and new_task_dict.get("start_date")
                    else parser.parse(new_task_dict["date"])
                )
            )
        )

        if not new_task_dict:
            recurrence.latest_occurrence = change_datetime
            recurrence.save()
            return Response(status=status.HTTP_204_NO_CONTENT)

        # Create the new task
        old_task = recurrence.task

        old_task_dict = model_to_dict(old_task)
        creation_kwargs = {**old_task_dict, **new_task_dict}
        if not new_task_dict.get("entities"):
            creation_kwargs["entities"] = [ent.id for ent in old_task_dict["entities"]]
        if not new_task_dict.get("members"):
            creation_kwargs["members"] = [
                member.id for member in old_task_dict["members"]
            ]

        if not new_task_dict["resourcetype"] == old_task.__class__.__name__:
            return Response(
                {"resourcetype": "resourcetype must match base task"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = TaskSerializer(data=creation_kwargs, context={"request": request})
        serializer.is_valid(raise_exception=True)
        new_task = serializer.save()

        if not creation_kwargs.get("recurrence"):
            # Create the new recurrence if a recurrence was not provided
            Recurrence.objects.create(
                earliest_occurrence=change_datetime,
                latest_occurrence=recurrence.latest_occurrence,
                recurrence=recurrence.recurrence,
                task=new_task,
            )

        # Update the old recurrence
        recurrence.latest_occurrence = change_datetime
        recurrence.save()

        parsed_new_task = TaskSerializer(new_task).data

        return Response(parsed_new_task, status=status.HTTP_201_CREATED)


class ScheduledTaskViewSet(ViewSet):
    """ScheduledTaskViewSet"""

    permission_classes = [
        IsAuthenticated,
    ]

    # @silk_profile(name="List scheduled tasks")
    def list(self, request):
        """Get all scheduled tasks after running the scheduling engine.

        The expected behaviour should be as follows:

        If no time filter is provided:
        - All tasks should be returned
        - Recurrent tasks will be returned with the recurrence property
            and no attempt will be made to provide specific instances of
            the task (as this could be an infinite list).

        If one of the start time and end time is provided:
        - Tasks that are scheduled to fall within the timeframe should be returned
        - Recurrent tasks will be returned with the recurrence property and
            no attempt will be made to provide specific instances of
            the task (as this could be an infinite list).

        If both start time and end time are providede:
        - All scheduled tasks lying within the timeframe should be returned
        - Recurrent tasks will be scheduled as appropriate and returned as
            individual tasks (all with the same task ID as they are associated
            to the same recurrent task).
        """
        earliest_datetime_string = request.GET.get("earliest_datetime")
        latest_datetime_string = request.GET.get("latest_datetime")

        if not earliest_datetime_string:
            return Response(
                {"message": "earliest_datetime required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not latest_datetime_string:
            return Response(
                {"message": "latest_datetime required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        earliest_datetime = parser.parse(earliest_datetime_string)
        latest_datetime = parser.parse(latest_datetime_string)

        engine = SchedulingEngine(
            request.user, start_date=earliest_datetime, end_date=latest_datetime
        )

        placed_tasks = engine.schedule_tasks()
        parsed_tasks = ScheduledTaskSerializer(placed_tasks, many=True).data

        placed_entitites = engine.schedule_entities()
        parsed_entities = ScheduledEntitySerializer(placed_entitites, many=True).data

        return Response(
            {"tasks": parsed_tasks, "entities": parsed_entities},
            status=status.HTTP_200_OK,
        )


class TaskActionViewSet(ModelViewSet):
    """TaskActionViewSet"""

    serializer_class = TaskActionSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return TaskAction.objects.filter(
            Q(task__members=self.request.user)
            | Q(task__entities__members=self.request.user)
        ).distinct()


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def bulk_create_tasks(request):
    """Bulk create tasks"""

    serializer = HolidayTaskWriteOnlySerializer(
        data=request.data, context={"request": request}, many=True
    )
    serializer.is_valid(raise_exception=True)
    serializer.save()

    return Response(
        [{"id": task["id"]} for task in serializer.data], status=status.HTTP_201_CREATED
    )
