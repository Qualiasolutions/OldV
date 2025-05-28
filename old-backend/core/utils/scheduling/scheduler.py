"""Scheduler"""

import datetime as dt
import logging
from collections import defaultdict
from typing import Dict, List, Literal, Optional, Set, Tuple, TypedDict, TypeVar, cast

import pytz
from dateutil.relativedelta import relativedelta
from django.apps import apps
from django.db.models import Q
from django.utils import timezone

from core.models.entities.base import Entity
from core.models.entities.career import DaysOff
from core.models.entities.education import School, SchoolBreak, SchoolTerm, SchoolYear
from core.models.entities.pets import Pet
from core.models.entities.travel import Trip
from core.models.routines.routines import Routine
from core.models.settings.blocked_days import (
    BirthdayBlockedCategory,
    DaysOffBlockedCategory,
    FamilyBirthdayBlockedCategory,
    NationalHolidaysBlockedCategory,
    TermTimeBlockedCategory,
    TripBlockedCategory,
)
from core.models.settings.family_visibility import FamilyCategoryViewPermission
from core.models.settings.preferred_days import PreferredDays
from core.models.task_completion_forms.base import TaskCompletionForm
from core.models.tasks.alerts import AlertName, Alerts
from core.models.tasks.base import (
    FixedTask,
    FlexibleTask,
    Recurrence,
    RecurrenceType,
    RecurrentTaskOverwrite,
    TaskAction,
    TaskActionCompletionForm,
)
from core.models.tasks.holidays import HolidayTask
from core.models.tasks.task_limits import TaskLimit
from core.models.users.user_models import User
from core.utils.tags import TagType
from external_calendars.models import ICalIntegration

logger = logging.getLogger(__name__)

utc = pytz.UTC


RELATIVE_DELTAS = {
    "DAY": relativedelta(days=1),
    "WEEK": relativedelta(weeks=1),
    "MONTH": relativedelta(months=1),
    "YEAR": relativedelta(years=1),
}

recurrence_mappings: Dict[RecurrenceType, relativedelta | None] = {
    "DAILY": RELATIVE_DELTAS["DAY"],
    "WEEKLY": RELATIVE_DELTAS["WEEK"],
    "MONTHLY": RELATIVE_DELTAS["MONTH"],
    "YEARLY": RELATIVE_DELTAS["YEAR"],
    "MONTH_WEEKLY": None,
    "MONTHLY_LAST_WEEK": None,
    "YEAR_MONTH_WEEKLY": None,
    "WEEKDAILY": None,
}


class ScheduledTask(TypedDict):
    """We parse all scheduled tasks into this format"""

    id: int
    is_complete: bool
    is_partially_complete: bool
    is_ignored: bool
    members: List[int]
    entities: List[int]
    actions: List[int]
    action_id: Optional[int]
    tags: List[TagType]
    start_datetime: Optional[dt.datetime]
    end_datetime: Optional[dt.datetime]
    start_date: Optional[dt.date]
    end_date: Optional[dt.date]
    duration: Optional[int]
    date: Optional[dt.date]
    recurrence: Optional[int]
    recurrence_index: Optional[int]
    routine: Optional[int]
    title: str
    resourcetype: str
    type: str
    alerts: Dict[AlertName, List[User]]


class ScheduledEntity(TypedDict):
    """We parse displayed entities into this format"""

    id: int
    members: List[int]
    start_date: Optional[dt.date]
    end_date: Optional[dt.date]
    start_datetime: Optional[dt.date]
    end_datetime: Optional[dt.date]
    title: str
    resourcetype: str
    recurrence_index: Optional[int]


class TaskPlacement(TypedDict):
    """TaskPlacement"""

    start_datetime: dt.datetime
    end_datetime: dt.datetime
    alerts: Dict[AlertName, List[User]]


class SchedulingException(Exception):
    """Custom Scheduling error"""


def ensure_date(date: dt.date | dt.datetime) -> dt.date:
    """Ensure that the variable provided is a date - converts it to
    a date if it is a datetime to start with"""
    if hasattr(date, "date"):
        return date.date()

    return date


def get_dates_between(start_date: dt.date, end_date: dt.date) -> List[dt.date]:
    """Get all of the dates between the two dates provided"""
    dates = []
    current_date = start_date
    while current_date <= end_date:
        dates.append(current_date)
        current_date += RELATIVE_DELTAS["DAY"]
    return dates


def get_preferred_weekdays(preferred_day_conf: PreferredDays) -> List[int]:
    """Get the preferred weekdays from a PreferredDays object"""
    preferred_weekdays = []
    if preferred_day_conf.monday:
        preferred_weekdays.append(0)
    if preferred_day_conf.tuesday:
        preferred_weekdays.append(1)
    if preferred_day_conf.wednesday:
        preferred_weekdays.append(2)
    if preferred_day_conf.thursday:
        preferred_weekdays.append(3)
    if preferred_day_conf.friday:
        preferred_weekdays.append(4)
    if preferred_day_conf.saturday:
        preferred_weekdays.append(5)
    if preferred_day_conf.sunday:
        preferred_weekdays.append(6)

    return preferred_weekdays


T = TypeVar("T", dt.date, dt.datetime)


def get_next_date(current_date: T, recurrence: Recurrence) -> T:
    """Get the next date after current_date based on the recurrence type provided"""
    recurrence_type = cast(RecurrenceType, recurrence.recurrence)
    interval_length = recurrence.interval_length

    recurrence_delta = recurrence_mappings[recurrence_type]
    if recurrence_delta:
        return current_date + (recurrence_delta * interval_length)
    elif recurrence_type == "MONTH_WEEKLY":
        week_number = (current_date.day - 1) // 7

        previous_date = current_date
        for _ in range(interval_length):
            four_weeks_later = previous_date + relativedelta(weeks=4)
            if previous_date.month == four_weeks_later.month:
                previous_date = four_weeks_later + RELATIVE_DELTAS["WEEK"]
                continue
            else:
                if (four_weeks_later.day - 1) // 7 == week_number:
                    previous_date = four_weeks_later
                    continue
                else:
                    previous_date = four_weeks_later + RELATIVE_DELTAS["WEEK"]
                    continue
        return previous_date
    elif recurrence_type == "MONTHLY_LAST_WEEK":
        previous_date = current_date
        for _ in range(interval_length):
            four_weeks_later = previous_date + relativedelta(weeks=4)
            if (
                four_weeks_later.month
                == (four_weeks_later + RELATIVE_DELTAS["WEEK"]).month
            ):
                previous_date = four_weeks_later + RELATIVE_DELTAS["WEEK"]
                continue
            else:
                previous_date = four_weeks_later
                continue
        return previous_date
    elif recurrence_type == "YEAR_MONTH_WEEKLY":
        week_number = (current_date.day - 1) // 7

        previous_date = current_date
        for _ in range(interval_length):
            one_year_later = previous_date + relativedelta(weeks=52)
            if previous_date.month != one_year_later.month:
                previous_date = one_year_later + RELATIVE_DELTAS["WEEK"]
                continue
            else:
                if (one_year_later.day - 1) // 7 == week_number:
                    previous_date = one_year_later
                    continue
                else:
                    previous_date = one_year_later + RELATIVE_DELTAS["WEEK"]
                    continue
        return previous_date
    elif recurrence_type == "WEEKDAILY":
        previous_date = current_date
        for _ in range(interval_length):
            day_number = previous_date.weekday()
            # If day is before Friday then just get next day
            if day_number < 4:
                previous_date = previous_date + RELATIVE_DELTAS["DAY"]
                continue
            # Otherwise skip over the weekend
            else:
                previous_date = previous_date + relativedelta(days=3)
                continue
        return previous_date

    raise SchedulingException("Could not calculate next date")


def get_next_interval(
    interval_start_date: T, interval_end_date: T, recurrence: Recurrence
) -> Tuple[T, T]:
    """Get the next interval"""
    next_start = get_next_date(interval_start_date, recurrence)
    next_end = interval_end_date + (next_start - interval_start_date)
    return (next_start, next_end)


class SchedulingEngine:
    """The main class for scheduling tasks"""

    def __init__(
        self,
        user: User,
        start_date: dt.datetime = timezone.make_aware(
            dt.datetime(year=2020, month=1, day=1)
        ),
        end_date: dt.datetime = timezone.make_aware(
            dt.datetime(year=2030, month=12, day=31)
        ),
    ):
        self.user = user
        self.user_entities = list(user.entities.all()) if getattr(user, "entities") else []  # type: ignore

        self.family_members = (
            list(user.family.users.all()) if (user.family and user.family.users) else []
        )
        self.start_date = start_date
        self.end_date = end_date

        # Do not include any overwrite tasks here as they will be implemented
        # as part of the recurring task placement.
        fixed_tasks = (
            FixedTask.objects.filter(
                (
                    Q(entities__members__in=self.family_members)
                    | Q(members__in=self.family_members)
                )
                & (
                    Q(recurrence__isnull=False)
                    | (
                        Q(start_datetime__lt=self.end_date)
                        & Q(end_datetime__gt=self.start_date)
                    )
                    | (Q(date__lt=self.end_date) & Q(date__gt=self.start_date))
                    | (
                        Q(start_date__lt=self.end_date)
                        & Q(end_date__gt=self.start_date)
                    )
                )
            )
            .select_related(
                "recurrence",
            )
            .prefetch_related(
                "members",
                "entities",
                "actions",
            )
            .distinct()
        )

        flexible_tasks = (
            FlexibleTask.objects.filter(
                (
                    Q(entities__members__in=self.family_members)
                    | Q(members__in=self.family_members)
                )
                & (
                    Q(recurrence__isnull=False)
                    | (
                        Q(recurrence__isnull=True)
                        & Q(earliest_action_date__lte=self.end_date)
                        & Q(due_date__gte=self.start_date)
                    )
                )
            )
            .select_related(
                "recurrence",
            )
            .prefetch_related(
                "members",
                "entities",
                "actions",
            )
            .distinct()
        )

        family_entities = Entity.objects.filter(
            Q(owner__in=self.family_members) | Q(members__in=self.family_members)
        )
        self.family_entities_dict: Dict[int, Entity] = {
            entity.id: entity for entity in family_entities
        }

        family_category_view_permissions = FamilyCategoryViewPermission.objects.filter(
            user__in=self.family_members
        ).distinct()

        self.fixed_tasks: List[FixedTask] = list(fixed_tasks)
        self.fixed_tasks_dict: Dict[int, FixedTask] = {
            task.id: task for task in fixed_tasks
        }
        self.flexible_tasks: List[FlexibleTask] = list(flexible_tasks)
        self.family_category_view_permissions: List[
            FamilyCategoryViewPermission
        ] = list(family_category_view_permissions)

        recurrence_overwrites_list = list(
            RecurrentTaskOverwrite.objects.filter(
                Q(recurrence__task__in=self.fixed_tasks)
                | Q(recurrence__task__in=self.flexible_tasks)
            )
        )
        recurrence_overwrites_dict: Dict[
            int, Dict[int, RecurrentTaskOverwrite]
        ] = defaultdict(dict)
        for overwrite in recurrence_overwrites_list:
            recurrence_overwrites_dict[overwrite.recurrence.id][
                overwrite.recurrence_index
            ] = overwrite
        self.recurrence_overwrites = recurrence_overwrites_dict

        task_actions_list = list(
            TaskAction.objects.filter(
                Q(task__in=self.fixed_tasks) | Q(task__in=self.flexible_tasks)
            )
        )
        task_actions_dict: Dict[int, TaskAction] = {}
        for action in task_actions_list:
            task_actions_dict[action.id] = action
        self.task_actions = task_actions_dict

        task_completion_form_list: List[TaskCompletionForm] = list(
            TaskCompletionForm.objects.filter(
                Q(task__in=self.fixed_tasks) | Q(task__in=self.flexible_tasks)
            )
            .order_by("id")
            .select_related("task")
        )

        task_completion_form_dict: Dict[
            int, Dict[int, List[TaskCompletionForm]]
        ] = defaultdict(lambda: defaultdict(list))
        for completion_form in task_completion_form_list:
            recurrence_index = (
                completion_form.recurrence_index
                if completion_form.recurrence_index is not None
                else -1
            )

            task_completion_form_dict[completion_form.task.id][recurrence_index].append(
                completion_form
            )

        self.task_completion_forms = task_completion_form_dict

        task_action_completion_form_list: List[TaskActionCompletionForm] = list(
            TaskActionCompletionForm.objects.filter(
                action__in=task_actions_list
            ).select_related("action")
        )
        task_action_completion_form_dict: Dict[
            int, Dict[int, List[TaskActionCompletionForm]]
        ] = defaultdict(lambda: defaultdict(list))
        for action_completion_form in task_action_completion_form_list:
            recurrence_index = (
                action_completion_form.recurrence_index
                if action_completion_form.recurrence_index is not None
                else -1
            )
            task_action_completion_form_dict[action_completion_form.action.id][
                recurrence_index
            ].append(action_completion_form)

        self.task_action_completion_forms = task_action_completion_form_dict

        self.placed_tasks: List[ScheduledTask] = []
        self.placed_national_holidays: List[ScheduledTask] = []
        self.placed_entities: List[ScheduledEntity] = []

        self.preferred_days = list(
            PreferredDays.objects.filter(user__in=self.family_members)
        )
        self.task_limits = list(TaskLimit.objects.filter(user__in=self.family_members))

        # Something like
        # {
        #     "2020-01-01": {
        #         2: {
        #             "PETS": {
        #                 "tasks": 10,
        #                 "minutes": 100
        #             }
        #         }
        #     }
        # }
        self.day_task_counts: Dict[
            dt.date, Dict[int, Dict[int, Dict[Literal["tasks", "minutes"], int]]]
        ] = defaultdict(
            lambda: defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
        )

        single_day_period_entity_types = ["Anniversary"]
        multi_day_period_entity_types = ["DaysOff", "Trip", "Event"]

        self.single_day_period_entities: List[Entity] = []
        for entity_type in single_day_period_entity_types:
            self.single_day_period_entities += list(
                apps.get_model("core", entity_type)
                .objects.filter(members__in=self.family_members)
                .prefetch_related(
                    "members",
                )
                .distinct()
            )

        self.multi_day_period_entities: List[Entity] = []
        for entity_type in multi_day_period_entity_types:
            self.multi_day_period_entities += list(
                apps.get_model("core", entity_type)
                .objects.filter(members__in=self.family_members)
                .prefetch_related(
                    "members",
                )
                .distinct()
            )

        self.schools = School.objects.filter(members__in=self.family_members)
        self.school_years = SchoolYear.objects.filter(school__in=self.schools)
        self.school_terms = SchoolTerm.objects.filter(school_year__in=self.school_years)
        self.school_breaks = SchoolBreak.objects.filter(
            school_year__in=self.school_years
        )

        self.ical_integrations = ICalIntegration.objects.filter(
            user__in=self.family_members
        ).distinct()

        self.pets: List[Pet] = list(
            Pet.objects.filter(members__in=self.family_members).distinct()
        )

    def unschedule_task(self, task_id: int):
        """Unschedule a task - remove all scheduled tasks for the task ID"""
        self.placed_tasks = [
            tsk for tsk in self.placed_tasks if not tsk["id"] == task_id
        ]

        self.placed_national_holidays = [
            tsk for tsk in self.placed_national_holidays if not tsk["id"] == task_id
        ]

    def schedule_task(
        self,
        task: ScheduledTask,
        categories: Optional[List[int]] = None,
        users: Optional[List[int]] = None,
    ):
        """Schedules a task according the the tasks placed so far
        and any other placement rules"""
        categories = categories or []
        users = users or []

        self.placed_tasks.append(task)

        if "SOCIAL_INTERESTS__HOLIDAY" in task["tags"]:
            self.placed_national_holidays.append(task)

        duration_attr = cast(Optional[int], task.get("duration"))
        date_attr = cast(Optional[dt.date], task.get("date"))
        start_datetime_attr = cast(Optional[dt.datetime], task.get("start_datetime"))
        end_datetime_attr = cast(Optional[dt.datetime], task.get("end_datetime"))
        start_date_attr = cast(Optional[dt.date], task.get("start_date"))
        end_date_attr = cast(Optional[dt.date], task.get("end_date"))

        task_dates = None
        if duration_attr and date_attr:
            task_duration = duration_attr
            task_dates = [date_attr]
        elif start_datetime_attr and end_datetime_attr:
            start_date = start_datetime_attr.date()
            end_date = end_datetime_attr.date()
            task_dates = get_dates_between(start_date, end_date)
        elif start_date_attr and end_date_attr:
            task_dates = get_dates_between(start_date_attr, end_date_attr)
            # Don't worry about counting towards the minutes limit
            task_duration = 0

        if task_dates:
            for date in task_dates:
                for category in categories:
                    for user in users:
                        self.day_task_counts[date][user][category]["tasks"] += 1

                        if duration_attr:
                            task_duration = duration_attr
                        elif start_datetime_attr and end_datetime_attr:
                            if start_date == end_date:
                                task_length_delta = (
                                    end_datetime_attr - start_datetime_attr
                                )
                                task_duration = int(
                                    task_length_delta.days * (24 * 60)
                                ) + int(task_length_delta.seconds / 60)
                            elif date == start_date:
                                task_duration = (
                                    (24 * 60)
                                    - (60 * start_datetime_attr.hour)
                                    - start_datetime_attr.minute
                                )
                            elif date == end_date:
                                task_duration = (
                                    60 * start_datetime_attr.hour
                                ) + start_datetime_attr.minute
                            else:
                                task_duration = 24 * 60

                        self.day_task_counts[date][user][category][
                            "minutes"
                        ] += task_duration

    def schedule_task_and_actions(
        self,
        task: ScheduledTask,
        categories: Optional[List[int]] = None,
        users: Optional[List[int]] = None,
    ):
        """schedule_task_and_actions"""
        task_actions = task["actions"]
        for action in task_actions:
            action_obj = self.task_actions[action]
            action_timedelta = action_obj.action_timedelta

            action_recurrence = (
                -1 if task["recurrence_index"] is None else task["recurrence_index"]
            )
            occurrence_completion_forms = self.task_action_completion_forms.get(
                action_obj.id
            ) and self.task_action_completion_forms[action_obj.id].get(
                action_recurrence
            )

            self.schedule_task(
                {
                    "id": task["id"],
                    "is_complete": bool(
                        occurrence_completion_forms
                        and occurrence_completion_forms[-1].complete
                    ),
                    "is_partially_complete": False,
                    "is_ignored": bool(
                        occurrence_completion_forms
                        and occurrence_completion_forms[-1].ignore
                    ),
                    "members": task["members"],
                    "duration": task["duration"],
                    "entities": task["entities"],
                    "actions": [],
                    "action_id": action,
                    "tags": task["tags"],
                    "recurrence": None,
                    "recurrence_index": task["recurrence_index"],
                    "title": f"ACTION - {task['title']}",
                    "alerts": {},
                    "routine": task["routine"],
                    "resourcetype": "TaskAction",
                    "type": task["type"],
                    "start_datetime": task["start_datetime"] - action_timedelta
                    if task["start_datetime"]
                    else None,
                    "end_datetime": task["end_datetime"] - action_timedelta
                    if task["end_datetime"]
                    else None,
                    "date": task["date"] - action_timedelta
                    if task["date"]
                    else (
                        task["start_date"] - action_timedelta
                        if task["start_date"]
                        else None
                    ),
                    "start_date": None,
                    "end_date": None,
                },
                categories=categories,
                users=users,
            )

        self.schedule_task(task, categories=categories, users=users)

    def place_fixed_occurrences_between(
        self, task: FixedTask, start_datetime: dt.datetime, end_datetime: dt.datetime
    ):
        """Place the occurrences of a recurring fixed task between the specified datetimes.

        task: A recurring FixedTask instance
        start_datetime: the start of the interval
        end_datetime: the end of the interval
        """

        (task_start, task_end, task_date, task_start_date, task_end_date) = (
            task.start_datetime,
            task.end_datetime,
            task.date,
            task.start_date,
            task.end_date,
        )
        recurrence = task.recurrence

        if not recurrence:
            raise SchedulingException(
                "Tried to schedule recurring events for a task without recurrence"
            )

        timeframe_start = (
            max(recurrence.earliest_occurrence, start_datetime)
            if recurrence.earliest_occurrence
            else start_datetime
        )
        timeframe_end = (
            min(recurrence.latest_occurrence, end_datetime)
            if recurrence.latest_occurrence
            else end_datetime
        )
        if timeframe_start > timeframe_end:
            return

        occurence_start = task_start
        occurence_end = task_end
        occurrence_date = task_date
        occurrence_start_date = task_start_date
        occurrence_end_date = task_end_date
        recurrence_index = 0
        while (
            (occurence_start and (occurence_start < timeframe_end))
            or (occurrence_date and occurrence_date < timeframe_end.date())
            or (occurrence_start_date and occurrence_start_date < timeframe_end.date())
        ):
            if (
                (occurence_start and occurence_start >= timeframe_start)
                or (occurrence_date and occurrence_date >= timeframe_start.date())
                or (
                    occurrence_end_date
                    and occurrence_end_date >= timeframe_start.date()
                )
            ):
                matching_override = self.recurrence_overwrites.get(
                    recurrence.id
                ) and self.recurrence_overwrites[recurrence.id].get(recurrence_index)

                if matching_override:
                    # Just skip over it because we have already placed the override

                    if occurence_start and occurence_end:
                        (occurence_start, occurence_end) = get_next_interval(
                            occurence_start, occurence_end, recurrence
                        )
                    if occurrence_start_date and occurrence_end_date:
                        (
                            occurrence_start_date,
                            occurrence_end_date,
                        ) = get_next_interval(
                            occurrence_start_date, occurrence_end_date, recurrence
                        )
                    elif occurrence_date:
                        (occurrence_date, _) = get_next_interval(
                            occurrence_date, occurrence_date, recurrence
                        )

                    recurrence_index += 1
                    continue

                occurrence_completion_forms = self.task_completion_forms.get(
                    task.id
                ) and self.task_completion_forms[task.id].get(recurrence_index)

                self.schedule_task_and_actions(
                    {
                        "id": task.id,
                        "is_complete": bool(
                            occurrence_completion_forms
                            and occurrence_completion_forms[-1].complete
                        ),
                        "is_partially_complete": bool(
                            occurrence_completion_forms
                            and occurrence_completion_forms[-1].partial
                        ),
                        "is_ignored": bool(
                            occurrence_completion_forms
                            and occurrence_completion_forms[-1].ignore
                        ),
                        "members": [m.id for m in task.members.all()],
                        "start_datetime": occurence_start,
                        "end_datetime": occurence_end,
                        "start_date": occurrence_start_date,
                        "end_date": occurrence_end_date,
                        "duration": task.duration,
                        "date": occurrence_date,
                        "entities": [e.id for e in task.entities.all()],
                        "actions": [a.id for a in task.actions.all()],
                        "action_id": None,
                        "tags": cast(List[TagType], task.tags),
                        "recurrence": recurrence.id,
                        "recurrence_index": recurrence_index,
                        "resourcetype": "FixedTask",
                        "type": task.type,
                        "title": task.title,
                        "alerts": {},
                        "routine": task.routine.id if task.routine else None,
                    },
                    categories=list(set([e.category for e in task.entities.all()])),
                    users=[m.id for m in task.members.all()],
                )

            if occurence_start and occurence_end:
                (occurence_start, occurence_end) = get_next_interval(
                    occurence_start, occurence_end, recurrence
                )
            elif occurrence_date:
                (occurrence_date, _) = get_next_interval(
                    occurrence_date, occurrence_date, recurrence
                )
            elif occurrence_start_date and occurrence_end_date:
                (occurrence_start_date, occurrence_end_date) = get_next_interval(
                    occurrence_start_date, occurrence_end_date, recurrence
                )

            recurrence_index += 1

        return

    def place_flexible_occurrences_between(
        self,
        task: FlexibleTask,
        start_datetime: dt.datetime,
        end_datetime: dt.datetime,
    ):
        """Place the occurrences of a recurring flexible task between the specified datetimes.

        task: A recurring FlexibleTask instance
        start_datetime: the start of the interval
        end_datetime: the end of the interval
        placed_tasks: the tasks that have been placed already to schedule around
        """
        (task_earliest, task_due) = (task.earliest_action_date, task.due_date)
        recurrence = task.recurrence

        if not recurrence:
            raise SchedulingException(
                "Tried to schedule recurring events for a task with recurrence"
            )

        if not task_due:
            raise SchedulingException(
                "Tried to schedule a flexible task with no due date"
            )

        if not task_earliest:
            raise SchedulingException(
                "Tried to schedule a flexible task with no earliest action date"
            )

        timeframe_start = (
            max(recurrence.earliest_occurrence, start_datetime)
            if recurrence.earliest_occurrence
            else start_datetime
        )
        timeframe_end = (
            min(recurrence.latest_occurrence, end_datetime)
            if recurrence.latest_occurrence
            else end_datetime
        )
        if timeframe_start > timeframe_end:
            return

        occurence_start = task_earliest
        occurence_end = task_due
        recurrence_index = 0

        if occurence_start:
            while occurence_start <= min(timeframe_end.date(), self.end_date.date()):
                if occurence_start >= max(
                    timeframe_start.date(), self.start_date.date()
                ):
                    matching_override = self.recurrence_overwrites.get(
                        recurrence.id
                    ) and self.recurrence_overwrites[recurrence.id].get(
                        recurrence_index
                    )
                    if matching_override:
                        # Just skip over it because we have already placed the override

                        (occurence_start, occurence_end) = get_next_interval(
                            occurence_start, occurence_end, recurrence
                        )

                        recurrence_index += 1
                        continue
                    task.earliest_action_date = occurence_start
                    task.due_date = occurence_end
                    self.place_flexible_task(
                        task, recurrence=recurrence, recurrence_index=recurrence_index
                    )

                (occurence_start, occurence_end) = get_next_interval(
                    occurence_start, occurence_end, recurrence
                )
                recurrence_index += 1

    def place_fixed_tasks(self):
        """Place the fixed tasks, including recurring tasks"""
        for fixed_task in self.fixed_tasks:
            if not hasattr(fixed_task, "recurrence"):
                task_completion_forms = self.task_completion_forms.get(
                    fixed_task.id
                ) and self.task_completion_forms[fixed_task.id].get(-1)
                is_complete = bool(
                    task_completion_forms and task_completion_forms[-1].complete
                )
                is_partially_complete = bool(
                    task_completion_forms and task_completion_forms[-1].partial
                )
                is_ignored = bool(
                    task_completion_forms and task_completion_forms[-1].ignore
                )

                self.schedule_task_and_actions(
                    {
                        "id": fixed_task.id,
                        "is_complete": is_complete,
                        "is_partially_complete": is_partially_complete,
                        "is_ignored": is_ignored,
                        "members": [m.id for m in fixed_task.members.all()],
                        "start_datetime": fixed_task.start_datetime,
                        "end_datetime": fixed_task.end_datetime,
                        "duration": fixed_task.duration,
                        "date": fixed_task.date,
                        "start_date": fixed_task.start_date,
                        "end_date": fixed_task.end_date,
                        "entities": [e.id for e in fixed_task.entities.all()],
                        "actions": [a.id for a in fixed_task.actions.all()],
                        "action_id": None,
                        "tags": cast(List[TagType], fixed_task.tags),
                        "recurrence": None,
                        "recurrence_index": None,
                        "resourcetype": "FixedTask",
                        "type": fixed_task.type,
                        "title": fixed_task.title,
                        "alerts": {},
                        "routine": fixed_task.routine.id
                        if fixed_task.routine
                        else None,
                    },
                    categories=list(
                        set([e.category for e in fixed_task.entities.all()])
                    ),
                    users=[m.id for m in fixed_task.members.all()],
                )
                continue

            self.place_fixed_occurrences_between(
                fixed_task, self.start_date, self.end_date
            )

    def place_entities(self):
        """Place all single and multi-day entities"""
        for single_day_entity in self.single_day_period_entities:
            date = None
            if hasattr(single_day_entity, "start_date"):
                date = single_day_entity.start_date
            elif hasattr(single_day_entity, "date"):
                date = single_day_entity.date
            elif hasattr(single_day_entity, "start_datetime"):
                date = single_day_entity.start_datetime.date()

            if date:
                scheduled_entity: ScheduledEntity = {
                    "id": single_day_entity.id,
                    "start_date": date,
                    "end_date": date,
                    "start_datetime": None,
                    "end_datetime": None,
                    "members": [m.id for m in single_day_entity.members.all()],
                    "title": single_day_entity.name,
                    "resourcetype": single_day_entity.__class__.__name__,
                    "recurrence_index": None,
                }

                self.placed_entities.append(scheduled_entity)

        for multi_day_entity in self.multi_day_period_entities:
            scheduled_multi_day_entity: ScheduledEntity = {
                "id": multi_day_entity.id,
                "start_date": multi_day_entity.start_date
                if hasattr(multi_day_entity, "start_date")
                else None,
                "end_date": multi_day_entity.end_date
                if hasattr(multi_day_entity, "end_date")
                else None,
                "start_datetime": multi_day_entity.start_datetime
                if hasattr(multi_day_entity, "start_datetime")
                else None,
                "end_datetime": multi_day_entity.end_datetime
                if hasattr(multi_day_entity, "end_datetime")
                else None,
                "members": [m.id for m in multi_day_entity.members.all()],
                "title": multi_day_entity.name,
                "resourcetype": multi_day_entity.__class__.__name__,
                "recurrence_index": None,
            }

            self.placed_entities.append(scheduled_multi_day_entity)

        for year in self.school_years:
            start_date = year.start_date
            end_date = year.end_date
            show_on_calendars = year.show_on_calendars

            if start_date and end_date and show_on_calendars:
                scheduled_start: ScheduledEntity = {
                    "id": year.id,
                    "start_date": start_date,
                    "end_date": start_date,
                    "start_datetime": None,
                    "end_datetime": None,
                    "members": [m.id for m in year.school.members.all()],
                    "title": f"{year.year} {year.school.name} First Day",
                    "resourcetype": "SchoolYearStart",
                    "recurrence_index": None,
                }

                scheduled_end: ScheduledEntity = {
                    "id": year.id,
                    "start_date": end_date,
                    "end_date": end_date,
                    "start_datetime": None,
                    "end_datetime": None,
                    "members": [m.id for m in year.school.members.all()],
                    "title": f"{year.year} {year.school.name} Last Day",
                    "resourcetype": "SchoolYearEnd",
                    "recurrence_index": None,
                }

                self.placed_entities.append(scheduled_start)
                self.placed_entities.append(scheduled_end)

        for school_break in self.school_breaks:
            start_date = school_break.start_date
            end_date = school_break.end_date
            show_on_calendars = school_break.show_on_calendars

            if start_date and end_date and show_on_calendars:
                scheduled_break: ScheduledEntity = {
                    "id": school_break.id,
                    "start_date": start_date,
                    "end_date": end_date,
                    "start_datetime": None,
                    "end_datetime": None,
                    "members": [
                        m.id for m in school_break.school_year.school.members.all()
                    ],
                    "title": school_break.name,
                    "resourcetype": "SchoolBreak",
                    "recurrence_index": None,
                }

                self.placed_entities.append(scheduled_break)

        for school_term in self.school_terms:
            start_date = school_term.start_date
            end_date = school_term.end_date
            show_on_calendars = school_term.show_on_calendars
            show_only_start_and_end = school_term.show_only_start_and_end

            if start_date and end_date and show_on_calendars:
                if show_only_start_and_end:
                    scheduled_term_start: ScheduledEntity = {
                        "id": school_term.id,
                        "start_date": start_date,
                        "end_date": start_date,
                        "start_datetime": None,
                        "end_datetime": None,
                        "members": [
                            m.id for m in school_term.school_year.school.members.all()
                        ],
                        "title": f"{school_term.name} First Day",
                        "resourcetype": "SchoolTermStart",
                        "recurrence_index": None,
                    }
                    self.placed_entities.append(scheduled_term_start)

                    scheduled_term_end: ScheduledEntity = {
                        "id": school_term.id,
                        "start_date": end_date,
                        "end_date": end_date,
                        "start_datetime": None,
                        "end_datetime": None,
                        "members": [
                            m.id for m in school_term.school_year.school.members.all()
                        ],
                        "title": f"{school_term.name} Last Day",
                        "resourcetype": "SchoolTermEnd",
                        "recurrence_index": None,
                    }
                    self.placed_entities.append(scheduled_term_end)
                else:
                    scheduled_term: ScheduledEntity = {
                        "id": school_term.id,
                        "start_date": start_date,
                        "end_date": end_date,
                        "start_datetime": None,
                        "end_datetime": None,
                        "members": [
                            m.id for m in school_term.school_year.school.members.all()
                        ],
                        "title": school_term.name,
                        "resourcetype": "SchoolTerm",
                        "recurrence_index": None,
                    }

                    self.placed_entities.append(scheduled_term)

        for pet in self.pets:
            date_of_birth = pet.dob
            if date_of_birth:
                recurrence_index = 0
                while date_of_birth < ensure_date(self.start_date):
                    date_of_birth += relativedelta(years=1)
                    recurrence_index += 1
                while date_of_birth < ensure_date(self.end_date):
                    scheduled_pet_birthday: ScheduledEntity = {
                        "id": pet.id,
                        "start_date": date_of_birth,
                        "end_date": date_of_birth,
                        "start_datetime": None,
                        "end_datetime": None,
                        "members": [m.id for m in pet.members.all()],
                        "title": f"{pet.name}'s Birthday",
                        "resourcetype": "PetBirthday",
                        "recurrence_index": recurrence_index,
                    }

                    self.placed_entities.append(scheduled_pet_birthday)
                    date_of_birth += relativedelta(years=1)
                    recurrence_index += 1

    def _is_day_blocked(self, date: dt.date, categories: List[int], users: List[User]):
        """Determine whether a day is blocked by the blocked day preferences"""
        birthday_blocked_days = [
            bd
            for bd in BirthdayBlockedCategory.objects.filter(user__in=users)
            if bd.category in categories and bd.user in users
        ]
        family_birthday_blocked_days = [
            bd
            for bd in FamilyBirthdayBlockedCategory.objects.filter(user__in=users)
            if bd.category in categories and bd.user in users
        ]
        trip_blocked_days = [
            bd
            for bd in TripBlockedCategory.objects.filter(user__in=users)
            if bd.category in categories and bd.user in users
        ]
        term_time_blocked_days = [
            bd
            for bd in TermTimeBlockedCategory.objects.filter(user__in=users)
            if bd.category in categories and bd.user in users
        ]
        national_holidays_blocked_days = [
            bd
            for bd in NationalHolidaysBlockedCategory.objects.filter(user__in=users)
            if bd.category in categories and bd.user in users
        ]
        days_off_blocked_days = [
            bd
            for bd in DaysOffBlockedCategory.objects.filter(user__in=users)
            if bd.category in categories and bd.user in users
        ]

        if birthday_blocked_days:
            for user_block in birthday_blocked_days:
                if (
                    user_block.user.dob
                    and (user_block.user.dob.day == date.day)
                    and (user_block.user.dob.month == date.month)
                ):
                    return True

        if family_birthday_blocked_days:
            if any(
                [
                    user.family
                    and any([member.dob == date for member in user.family.users.all()])
                    for user in users
                ]
            ):
                return True

        if national_holidays_blocked_days:
            relevant_holidays = list(
                HolidayTask.objects.filter(
                    Q(start_date__lte=date)
                    & Q(end_date__gte=date)
                    & Q(tags__contains=["SOCIAL_INTERESTS__HOLIDAY"])
                    & Q(members__in=users)
                )
            )
            if any(
                [
                    hol.start_date
                    and hol.end_date
                    and (hol.start_date <= date and hol.end_date >= date)
                    for hol in relevant_holidays
                ]
            ):
                return True

        if trip_blocked_days:
            relevant_trips = Trip.objects.filter(members__in=users)
            if any(
                [
                    (trip.start_date <= date and trip.end_date >= date)
                    for trip in relevant_trips
                ]
            ):
                return True

        if term_time_blocked_days:
            schools = self.schools.filter(members__in=users)
            school_years = SchoolYear.objects.filter(school__in=schools)
            school_terms = SchoolTerm.objects.filter(school_year__in=school_years)

            if any(
                [
                    (school_term.start_date <= date and school_term.end_date >= date)
                    for school_term in school_terms
                ]
            ):
                return True

        if days_off_blocked_days:
            relevant_days_off = DaysOff.objects.filter(members__in=users)
            if any(
                [
                    (days_off.start_date <= date and days_off.end_date >= date)
                    for days_off in relevant_days_off
                ]
            ):
                return True

        return False

    def _has_hit_day_limit(
        self, date: dt.date, categories: List[int], users: List[User]
    ):
        """Check whether we have reached the day limit for the day
        and any of the categories / users provided"""
        task_limits: List[TaskLimit] = [
            tl
            for tl in self.task_limits
            if tl.category in categories and tl.user in users
        ]
        daily_task_limits = [tl for tl in task_limits if tl.interval == "DAILY"]
        daily_limits: Dict[
            int, Dict[int, Dict[Literal["tasks", "minutes"], Optional[int]]]
        ] = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))

        for lim in daily_task_limits:
            daily_limits[lim.category][lim.user.id] = {
                "tasks": lim.tasks_limit,
                "minutes": lim.minutes_limit,
            }

        for category in categories:
            for user in users:
                cat_task_count = self.day_task_counts[date][user.id][category]["tasks"]
                cat_minute_count = self.day_task_counts[date][user.id][category][
                    "minutes"
                ]
                cat_task_limit = daily_limits[category][user.id]["tasks"]
                cat_minutes_limit = daily_limits[category][user.id]["minutes"]
                if cat_task_limit and (cat_task_count >= cat_task_limit):
                    return True
                if cat_minutes_limit and (cat_minute_count >= cat_minutes_limit):
                    return True

        return False

    def _preferred_weekdays(self, categories: List[int], users: List[User]):
        """Get the preferred days for the categories provided.

        We return the weekday numbers which are preferred for
        ALL of the categories provide.
        """
        preferred_days: List[PreferredDays] = [
            p
            for p in self.preferred_days
            if p.category in categories and p.user in users
        ]
        if not preferred_days:
            return list(range(7))

        preferred_weekdays = set(range(7))
        for preferred_day_conf in preferred_days:
            preferred_weekdays = preferred_weekdays.intersection(
                set(get_preferred_weekdays(preferred_day_conf))
            )

        return preferred_weekdays

    def _total_minutes_on_day(self, date: dt.date, users: List[User]):
        """Calculate the total number of minutes placed on the day so far
        for the users provided
        """
        num_mins = 0
        for user in users:
            cat_counts = self.day_task_counts[date][user.id].values()
            for cat_count in cat_counts:
                num_mins += cat_count["minutes"]

        return num_mins

    def _routine_dates(
        self,
        earliest_action_date: dt.datetime | dt.date,
        due_date: dt.datetime | dt.date,
        routine: Routine,
    ):
        """Get the dates for a routine between the dates provided"""
        permitted_dates = get_dates_between(
            ensure_date(earliest_action_date), ensure_date(due_date)
        )

        preferred_days = []
        for i, preferred in enumerate(
            [
                routine.monday,
                routine.tuesday,
                routine.wednesday,
                routine.thursday,
                routine.friday,
                routine.saturday,
                routine.sunday,
            ]
        ):
            if preferred:
                preferred_days.append(i)

        preferred_dates = [
            date for date in permitted_dates if date.weekday() in preferred_days
        ]

        return preferred_dates

    def _preferred_dates(
        self,
        earliest_action_date: dt.datetime | dt.date,
        due_date: dt.datetime | dt.date,
        categories: List[int],
        users: List[User],
    ):
        """Get the preferred dates on which to place a task.
        Order by the total number of minutes worth of
        tasks so far applied to each day
        """
        permitted_dates = get_dates_between(
            ensure_date(earliest_action_date), ensure_date(due_date)
        )
        preferred_weekdays = self._preferred_weekdays(categories, users)
        preferred_dates = [
            date for date in permitted_dates if date.weekday() in preferred_weekdays
        ]

        return sorted(
            preferred_dates, key=lambda date: self._total_minutes_on_day(date, users)
        )

    def is_slot_available(
        self, candidate_start_time: dt.datetime, candidate_end_time: dt.datetime
    ):
        """Check whether the slot is available"""
        if all(
            [
                (
                    candidate_start_time >= task["end_datetime"]
                    or candidate_end_time <= task["start_datetime"]
                )
                for task in self.placed_tasks
                if task["end_datetime"] and task["start_datetime"]
            ]
        ):
            return True

        return False

    def is_slot_available_for_user(
        self,
        candidate_start_time: dt.datetime,
        candidate_end_time: dt.datetime,
        user: User,
    ):
        """Check whether the slot is available for the specific user"""
        if all(
            [
                (
                    candidate_start_time >= task["end_datetime"]
                    or candidate_end_time <= task["start_datetime"]
                )
                for task in self.placed_tasks
                if task["end_datetime"]
                and task["start_datetime"]
                and user.id in task["members"]
            ]
        ):
            return True

        return False

    def get_alerted_users(
        self,
        alert: AlertName,
        categories: List[int],
        users: List[User],
        start_time: Optional[dt.datetime] = None,
        end_time: Optional[dt.datetime] = None,
        start_date: Optional[dt.date] = None,
        end_date: Optional[dt.date] = None,
        date: Optional[dt.date] = None,
    ):
        """Get the users who have a specific alert at a given time"""
        start_date = cast(
            dt.date, date or start_date or (start_time and start_time.date())
        )
        end_date = cast(dt.date, date or end_date or (end_time and end_time.date()))

        start_weekday = cast(
            int, (date and date.weekday()) or (start_time and start_time.weekday())
        )
        end_weekday = cast(
            int, (date and date.weekday()) or (end_time and end_time.weekday())
        )

        if alert == "BLOCKED_DAY":
            return [
                user
                for user in users
                if self._is_day_blocked(start_date, categories, [user])
                or self._is_day_blocked(end_date, categories, [user])
            ]
        if alert == "TASK_LIMIT_EXCEEDED":
            return [
                user
                for user in users
                if self._has_hit_day_limit(start_date, categories, [user])
                or self._has_hit_day_limit(end_date, categories, [user])
            ]
        if alert == "UNPREFERRED_DAY":
            return [
                user
                for user in users
                if not (
                    start_time
                    and start_weekday in self._preferred_weekdays(categories, [user])
                )
                or not (
                    end_time
                    and end_weekday in self._preferred_weekdays(categories, [user])
                )
            ]
        if alert == "TASK_CONFLICT" and start_time and end_time:
            return [
                user
                for user in users
                if not self.is_slot_available_for_user(start_time, end_time, user)
            ]

        return []

    def get_task_placement(
        self,
        earliest_action_date: dt.datetime | dt.date,
        due_date: dt.datetime | dt.date,
        duration_minutes: int,
        categories: List[int],
        users: List[User],
        routine: Optional[Routine],
    ) -> TaskPlacement:
        """Get the best task placement for the provided flexible task params with the following placement preference order:

        1. No alert - Placement on a preferred day, no blocked tag conflict, no task limit exceeded - preferred days should
                be tried in ascending order of current total time assigned to that day (summing over all assigned members)
        2. TASK_LIMIT_EXCEEDED - Placement on a preferred day, no blocked tag conflict, task limit exceeded
        3. TASK_CONFLICT - Placement on first preferred day, even if the day is already full of tasks
        4. BLOCKED_DAY - all preferred days are blocked, place it on the first one
        5. NO_PREFERRED_DAY - different members' preferred days don't overlap. Place it at the earliest possible place
        """

        routine_dates = (
            self._routine_dates(earliest_action_date, due_date, routine)
            if routine
            else None
        )
        routine_hours = (
            range(routine.start_time.hour, routine.end_time.hour) if routine else None
        )

        preferred_dates = self._preferred_dates(
            earliest_action_date, due_date, categories, users
        )

        if routine_dates:
            preferred_dates = [
                date for date in preferred_dates if date in routine_dates
            ]

        day_limited_dates = []
        blocked_dates = []
        full_dates = []

        for action_day in preferred_dates:
            hit_task_limit = self._has_hit_day_limit(action_day, categories, users)
            day_is_blocked = self._is_day_blocked(action_day, categories, users)

            if hit_task_limit:
                day_limited_dates.append(action_day)

            if day_is_blocked:
                blocked_dates.append(action_day)

            if hit_task_limit or day_is_blocked:
                continue

            found_placement = False
            for start_hour in routine_hours or range(8, 19):
                candidate_start_time = dt.datetime(
                    action_day.year,
                    action_day.month,
                    action_day.day,
                    start_hour,
                    tzinfo=utc,
                )
                candidate_end_time = candidate_start_time + dt.timedelta(
                    minutes=duration_minutes
                )

                # If all placed tasks either end before the candidate task would start
                # or start after the candidate task would end then we can place the task
                # without conflicts.
                if self.is_slot_available(candidate_start_time, candidate_end_time):
                    # Return if day is not blocked
                    if not (hit_task_limit or day_is_blocked):
                        return {
                            "start_datetime": candidate_start_time,
                            "end_datetime": candidate_end_time,
                            "alerts": {},
                        }

                    # Otherwise we found a placement
                    found_placement = True
                    break

            if not found_placement:
                full_dates.append(action_day)

        # If we reach this point then no task placement was possible
        # subject to all placement preferences. We must try in order:
        # 1. placement on preferred day with task limit exceeded
        # 2. placement on full day with task conflicts
        # 3. placement on blocked day
        # There are actually seven possible scenarios corresponding to
        # the overlaps of these three different conditions.
        block_reasons: Dict[dt.date, Set[AlertName]] = defaultdict(set)
        for date in day_limited_dates:
            block_reasons[date].add(Alerts.TASK_LIMIT_EXCEEDED.value)
        for date in full_dates:
            block_reasons[date].add(Alerts.TASK_CONFLICT.value)
        for date in blocked_dates:
            block_reasons[date].add(Alerts.BLOCKED_DAY.value)

        preferrence_order: List[Set[AlertName]] = [
            {
                Alerts.TASK_LIMIT_EXCEEDED.value,
            },
            {
                Alerts.TASK_CONFLICT.value,
            },
            {Alerts.TASK_LIMIT_EXCEEDED.value, Alerts.TASK_CONFLICT.value},
            {
                Alerts.BLOCKED_DAY.value,
            },
            {Alerts.BLOCKED_DAY.value, Alerts.TASK_LIMIT_EXCEEDED.value},
            {Alerts.BLOCKED_DAY.value, Alerts.TASK_CONFLICT.value},
            {
                Alerts.BLOCKED_DAY.value,
                Alerts.TASK_LIMIT_EXCEEDED.value,
                Alerts.TASK_CONFLICT.value,
            },
        ]

        current_best_date = preferred_dates[0]
        current_best_index = preferrence_order.index(block_reasons[current_best_date])
        for date in preferred_dates:
            pref_index = preferrence_order.index(block_reasons[date])
            if pref_index < current_best_index:
                current_best_date = date
                current_best_index = pref_index

        default_action_date = current_best_date

        default_start_time = dt.datetime(
            default_action_date.year,
            default_action_date.month,
            default_action_date.day,
            8,
            tzinfo=utc,
        )
        default_end_time = default_start_time + dt.timedelta(minutes=duration_minutes)

        alerts_dict: Dict[AlertName, list[User]] = {}
        alerts = list(preferrence_order[current_best_index])
        for alert in alerts:
            alerts_dict[alert] = self.get_alerted_users(
                alert,
                categories,
                users,
                start_time=default_start_time,
                end_time=default_end_time,
            )

        return {
            "start_datetime": default_start_time,
            "end_datetime": default_end_time,
            "alerts": alerts_dict,
        }

    def place_flexible_task(
        self,
        flexible_task: FlexibleTask,
        recurrence: Optional[Recurrence] = None,
        recurrence_index: Optional[int] = None,
    ):
        """Place a flexible task according to the tasks that have already
        been placed, with the following placement preference order:
        """

        earliest_action_date = flexible_task.earliest_action_date
        due_date = flexible_task.due_date
        if earliest_action_date and due_date:
            categories = list(set([e.category for e in flexible_task.entities.all()]))
            completion_forms = self.task_completion_forms.get(
                flexible_task.id
            ) and self.task_completion_forms[flexible_task.id].get(
                recurrence_index or -1
            )
            is_complete = bool(
                completion_forms
                and completion_forms[-1]
                and completion_forms[-1].complete
            )
            is_partially_complete = bool(
                completion_forms
                and completion_forms[-1]
                and completion_forms[-1].partial
            )
            is_ignored = bool(
                completion_forms
                and completion_forms[-1]
                and completion_forms[-1].ignore
            )

            task_placement = self.get_task_placement(
                earliest_action_date,
                due_date,
                flexible_task.duration,
                categories,
                list(flexible_task.members.all()),
                flexible_task.routine,
            )

            if task_placement["start_datetime"] < self.start_date:
                # We managed to place the task before the start time -
                # in this case we should not return the task
                return

            self.schedule_task_and_actions(
                {
                    "start_datetime": task_placement["start_datetime"],
                    "end_datetime": task_placement["end_datetime"],
                    "start_date": None,
                    "end_date": None,
                    "duration": None,
                    "date": None,
                    "id": flexible_task.id,
                    "entities": [e.id for e in flexible_task.entities.all()],
                    "actions": [a.id for a in flexible_task.actions.all()],
                    "action_id": None,
                    "tags": cast(List[TagType], flexible_task.tags),
                    "is_complete": is_complete,
                    "is_partially_complete": is_partially_complete,
                    "is_ignored": is_ignored,
                    "members": [m.id for m in flexible_task.members.all()],
                    "recurrence": recurrence.id if recurrence else None,
                    "recurrence_index": recurrence_index,
                    "resourcetype": "FlexibleTask",
                    "type": flexible_task.type,
                    "title": flexible_task.title,
                    "alerts": task_placement["alerts"],
                    "routine": flexible_task.routine.id
                    if flexible_task.routine
                    else None,
                },
                categories=list(
                    set([e.category for e in flexible_task.entities.all()])
                ),
                users=[m.id for m in flexible_task.members.all()],
            )
            return

        raise SchedulingException(
            "Cannot not place flexible task without earliest_action_date or due_date"
        )

    def place_flexible_tasks(self):
        """Place the flexible tasks, including recurring tasks"""
        for flexible_task in self.flexible_tasks:
            if not hasattr(flexible_task, "recurrence"):
                self.place_flexible_task(flexible_task)
                continue

            self.place_flexible_occurrences_between(
                flexible_task,
                self.start_date,
                self.end_date,
            )

    def schedule_tasks(self):
        """Schedule all tasks"""
        self.place_fixed_tasks()
        self.place_flexible_tasks()

        user_entity_ids = [ent.id for ent in self.user_entities]

        for placed_task in self.placed_tasks:
            if (
                placed_task["id"] in self.fixed_tasks_dict
                and hasattr(
                    self.fixed_tasks_dict[placed_task["id"]], "ical_integration"
                )
                and not (
                    self.fixed_tasks_dict[placed_task["id"]].ical_integration.user
                    == self.user
                )
                and self.fixed_tasks_dict[placed_task["id"]].ical_integration.share_type
                == "BUSY"
            ):
                placed_task["title"] = "BUSY"

        return sorted(
            [
                t
                for t in self.placed_tasks
                if self.user.id in t["members"]
                or any([e in user_entity_ids for e in t["entities"]])
                or (  # Shared appointments
                    self.fixed_tasks_dict.get(t["id"])
                    and self.fixed_tasks_dict[t["id"]].type == "APPOINTMENT"
                    and any(
                        [
                            perm.user.id in t["members"]
                            and perm.category
                            in [
                                ent.category
                                for ent in [
                                    self.family_entities_dict[ent_id]
                                    for ent_id in t["entities"]
                                ]
                            ]
                            for perm in self.family_category_view_permissions
                        ]
                    )
                )
                or (  # Shared External Calendars
                    self.fixed_tasks_dict.get(t["id"])
                    and self.fixed_tasks_dict[t["id"]].type == "ICAL_EVENT"
                    and hasattr(self.fixed_tasks_dict[t["id"]], "ical_integration")
                    and (
                        self.fixed_tasks_dict[t["id"]].ical_integration.share_type
                        in ["FULL", "BUSY"]
                    )
                )
            ],
            key=lambda t: t.get("start_datetime")
            or timezone.make_aware(
                dt.datetime.combine(t.get("date") or t.get("start_date"), dt.time.min)
            ),
        )

    def schedule_entities(self):
        """Schedule all entities"""
        self.place_entities()
        return sorted(
            [ent for ent in self.placed_entities if self.user.id in ent["members"]],
            key=lambda t: timezone.make_aware(
                dt.datetime.combine(
                    t.get("start_date") or t.get("start_datetime"), dt.time.min
                )
            ),
        )
