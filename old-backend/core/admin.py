"""Register the admin models"""

from django.contrib import admin

from core.models.emails.emails import Email
from core.models.messages.base import Message
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
from core.models.tasks.alerts import ActionAlert, Alert
from core.models.tasks.anniversaries import (
    AnniversaryTask,
    BirthdayTask,
    UserBirthdayTask,
)
from core.models.tasks.holidays import HolidayTask
from core.models.tasks.task_limits import TaskLimit
from core.models.tasks.travel import AccommodationTask, TransportTask

from .models.entities.anniversaries import Birthday
from .models.entities.base import Entity, Reference, ReferenceGroup
from .models.entities.education import School, SchoolBreak, SchoolTerm, SchoolYear
from .models.entities.home import Home
from .models.entities.lists import (
    List,
    ListEntry,
    PlanningList,
    PlanningListItem,
    PlanningSublist,
    ShoppingList,
    ShoppingListDelegation,
    ShoppingListItem,
    ShoppingListStore,
)
from .models.entities.pets import Pet
from .models.entities.social import (
    Event,
    GuestListInvite,
    Holiday,
    SocialMedia,
    SocialPlan,
)
from .models.entities.transport import Car
from .models.tasks.base import (
    FixedTask,
    FlexibleTask,
    Recurrence,
    RecurrentTaskOverwrite,
    Task,
    TaskAction,
    TaskActionCompletionForm,
    TaskReminder,
)
from .models.users.user_models import (
    CategorySetupCompletion,
    EntityTypeSetupCompletion,
    Family,
    LastActivityView,
    LinkListSetupCompletion,
    User,
    UserInvite,
)
from .models.timeblocks.timeblocks import TimeBlock


class TaskMembershipInline(admin.TabularInline):
    """TaskMembershipInline"""

    model = Task.members.through


class EntityMembershipInline(admin.TabularInline):
    """EntityMembershipInline"""

    model = Entity.members.through


class TaskAdmin(admin.ModelAdmin):
    """TaskAdmin"""

    inlines = [TaskMembershipInline]


class FixedTaskAdmin(TaskAdmin):
    """FixedTaskAdmin"""

    list_display = ("id", "title", "start_datetime", "end_datetime", "created_at")
    search_fields = ("title",)


class EntityAdmin(admin.ModelAdmin):
    """EntityAdmin"""

    inlines = [EntityMembershipInline]


entity_models = [
    Entity,
    Car,
    Event,
    Birthday,
    List,
    Pet,
    Home,
    SocialMedia,
    SocialPlan,
    Holiday,
    School,
]

admin.site.register(entity_models, EntityAdmin)


@admin.register(GuestListInvite)
class GuestListInviteAdmin(admin.ModelAdmin):
    """GuestListInviteAdmin"""

    model = GuestListInvite
    list_display = (
        "id",
        "email",
        "phone_number",
        "accepted",
        "rejected",
        "maybe",
        "sent",
    )


@admin.register(ListEntry)
class ListEntryAdmin(admin.ModelAdmin):
    """ListEntryAdmin"""

    model = ListEntry
    list_display = (
        "id",
        "title",
    )


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    """UserAdmin"""

    model = User
    list_display = (
        "username",
        "phone_number",
        "email",
        "first_name",
        "last_name",
        "family",
    )


admin.site.register(Family)
admin.site.register(UserInvite)
admin.site.register(CategorySetupCompletion)
admin.site.register(EntityTypeSetupCompletion)
admin.site.register(LinkListSetupCompletion)

admin.site.register(LastActivityView)

admin.site.register(FlexibleTask, TaskAdmin)
admin.site.register(FixedTask, FixedTaskAdmin)
admin.site.register(TransportTask, FixedTaskAdmin)
admin.site.register(AccommodationTask, FixedTaskAdmin)
admin.site.register(AnniversaryTask, FixedTaskAdmin)
admin.site.register(BirthdayTask, FixedTaskAdmin)
admin.site.register(UserBirthdayTask, FixedTaskAdmin)
admin.site.register(HolidayTask, FixedTaskAdmin)


@admin.register(TaskReminder)
class TaskReminderAdmin(admin.ModelAdmin):
    """TaskReminderAdmin"""

    model = TaskReminder
    list_display = ("id", "task", "timedelta")


@admin.register(Recurrence)
class RecurrenceAdmin(admin.ModelAdmin):
    """RecurrenceAdmin"""

    model = Recurrence
    list_display = ("id", "task")


@admin.register(TaskCompletionForm)
class TaskCompletionFormAdmin(admin.ModelAdmin):
    """TaskCompletionFormAdmin"""

    model = Recurrence
    list_display = ("id", "task", "recurrence_index", "complete", "partial", "ignore")


@admin.register(TaskActionCompletionForm)
class TaskActionCompletionFormAdmin(admin.ModelAdmin):
    """TaskActionCompletionFormAdmin"""

    model = Recurrence
    list_display = ("id", "action", "recurrence_index")


admin.site.register(Task)
admin.site.register(TaskLimit)

admin.site.register(FamilyCategoryViewPermission)
admin.site.register(PreferredDays)


admin.site.register(BirthdayBlockedCategory)
admin.site.register(FamilyBirthdayBlockedCategory)
admin.site.register(NationalHolidaysBlockedCategory)
admin.site.register(TermTimeBlockedCategory)
admin.site.register(TripBlockedCategory)
admin.site.register(DaysOffBlockedCategory)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    """MessageAdmin"""

    model = Message
    list_display = ("id", "task", "entity", "text")


admin.site.register(RecurrentTaskOverwrite)


@admin.register(Reference)
class ReferenceAdmin(admin.ModelAdmin):
    """ReferenceAdmin"""

    model = Reference
    list_display = ("id", "name", "value", "type", "created_at", "created_by")


@admin.register(ReferenceGroup)
class ReferenceGroupAdmin(admin.ModelAdmin):
    """ReferenceGroupAdmin"""

    model = Reference
    list_display = ("id", "name", "created_at", "created_by")


@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    """AlertAdmin"""

    model = Alert
    list_display = ("id", "user", "type", "task")


@admin.register(ActionAlert)
class ActionAlertAdmin(admin.ModelAdmin):
    """ActionAlertAdmin"""

    model = ActionAlert
    list_display = ("id", "user", "type", "action")


@admin.register(TaskAction)
class TaskActionAdmin(admin.ModelAdmin):
    """TaskActionAdmin"""

    model = TaskAction
    list_display = (
        "id",
        "task",
        "action_timedelta",
    )


@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    """Email admin"""

    model = Email
    list_display = ("id", "subject", "to", "from_email", "time", "env")
    search_fields = ("to", "from_email")
    ordering = ("-time",)


@admin.register(Routine)
class RoutineAdmin(admin.ModelAdmin):
    """Routine admin"""

    model = Routine
    list_display = (
        "id",
        "name",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
        "start_time",
        "end_time",
    )
    search_fields = ("name",)


admin.site.register(PlanningList)
admin.site.register(PlanningSublist)
admin.site.register(PlanningListItem)
admin.site.register(ShoppingList)
admin.site.register(ShoppingListStore)
admin.site.register(ShoppingListDelegation)


@admin.register(ShoppingListItem)
class ShoppingListItemAdmin(admin.ModelAdmin):
    """ShoppingListItem admin"""

    model = ShoppingListItem
    list_display = (
        "title",
        "list",
        "store",
    )


@admin.register(SchoolBreak)
class SchoolBreakAdmin(admin.ModelAdmin):
    """SchoolBreak admin"""

    model = SchoolBreak
    list_display = ("name", "start_date", "end_date", "show_on_calendars")


@admin.register(SchoolTerm)
class SchoolTermAdmin(admin.ModelAdmin):
    """SchoolTerm admin"""

    model = SchoolTerm
    list_display = ("name", "start_date", "end_date", "show_on_calendars")


admin.site.register(SchoolYear)


admin.site.register(TimeBlock)
