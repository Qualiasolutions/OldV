"""URLs"""

from django.urls import path
from rest_framework.routers import DefaultRouter

from core.serializers.users import LastActivityViewSerializer
from core.views.alerts_viewsets import (
    ActionAlertsViewSet,
    AlertsViewSet,
    mark_alerts_read,
)
from core.views.category_viewsets import (
    CategoriesViewset,
    ProfessionalCategoriesViewset,
)
from core.views.entity_viewsets import (
    EntityReadonlyViewSet,
    EntityViewSet,
    GuestListInviteInviteeViewSet,
    GuestListInviteViewSet,
    SchoolBreakViewSet,
    SchoolTermViewSet,
    SchoolYearViewSet,
)
from core.views.holidays_views import get_countries, get_holidays
from core.views.list_viewsets import (
    DelegatedShoppingListItemViewSet,
    ListEntryViewSet,
    PlanningListItemViewSet,
    PlanningListTemplatesViewSet,
    PlanningListViewSet,
    PlanningSublistViewSet,
    ShoppingListDelegationViewSet,
    ShoppingListItemViewSet,
    ShoppingListStoreViewSet,
    ShoppingListViewSet,
    create_from_default_template,
    create_template,
)
from core.views.message_viewsets import MessageViewset, message_threads
from core.views.reference_viewsets import (
    ReferenceGroupViewset,
    ReferenceViewset,
    retrieve_password_reference,
)
from core.views.routine_viewsets import RoutineViewset
from core.views.settings_views import (
    BirthdayBlockedCategoryViewset,
    DaysOffBlockedCategoryViewset,
    FamilyBirthdayBlockedCategoryViewset,
    FamilyCategoryViewPermissionViewset,
    NationalHolidaysBlockedCategoryViewset,
    PreferredDaysViewset,
    TermTimeBlockedCategoryViewset,
    TripBlockedCategoryViewset,
)
from core.views.tag_views import get_tag_options
from core.views.task_action_completion_form_viewsets import (
    TaskActionCompletionFormViewSet,
)
from core.views.task_completion_form_viewsets import TaskCompletionFormViewSet
from core.views.task_limit_viewsets import TaskLimitViewSet
from core.views.task_viewsets import (
    FlexibleFixedTaskViewSet,
    RecurrentTaskOverwriteViewSet,
    RecurrentTaskUpdateAfterViewSet,
    ScheduledTaskViewSet,
    TaskActionViewSet,
    TaskViewSet,
    bulk_create_tasks,
)
from core.views.timeblock_viewsets import TimeBlockViewset
from core.views.user_viewsets import (
    CategorySetupCompletionViewset,
    EntityTypeSetupCompletionViewset,
    FamilyViewSet,
    FriendshipViewset,
    FullUserInviteViewSet,
    LastActivityViewSet,
    LinkListSetupCompletionViewset,
    ReferencesSetupCompletionViewset,
    TagSetupCompletionViewset,
    UserInviteViewSet,
    UserMinimalEmailLookupReadonlyViewset,
    UserMinimalIdLookupViewset,
    UserMinimalReadonlyViewset,
    UserSecureUpdateViewSet,
    UserViewSet,
    UserWithFamilyViewSet,
)

router = DefaultRouter()
router.register(r"task", TaskViewSet, basename="task")
router.register(
    r"flexible-fixed-task", FlexibleFixedTaskViewSet, basename="flexible-fixed-task"
)
router.register(r"task-limit", TaskLimitViewSet, basename="task-limit")
router.register(r"scheduled_task", ScheduledTaskViewSet, basename="scheduled_task")
router.register(
    r"recurrent_task_overwrite",
    RecurrentTaskOverwriteViewSet,
    basename="recurrent_task_overwrite",
)
router.register(
    r"recurrent_task_update_after",
    RecurrentTaskUpdateAfterViewSet,
    basename="recurrent_task_update_after",
)

router.register(
    r"task-action",
    TaskActionViewSet,
    basename="task-action",
)

router.register(r"entity", EntityViewSet, basename="entity")
router.register(r"readonly/entity", EntityReadonlyViewSet, basename="entity-readonly")
router.register(r"list-entry", ListEntryViewSet, basename="list-entry")

router.register(r"planning-list", PlanningListViewSet, basename="planning-list")
router.register(
    r"planning-list-template",
    PlanningListTemplatesViewSet,
    basename="planning-list-template",
)

router.register(
    r"planning-sublist", PlanningSublistViewSet, basename="planning-sublist"
)
router.register(
    r"planning-list-item", PlanningListItemViewSet, basename="planning-list-item"
)

router.register(r"shopping-list", ShoppingListViewSet, basename="shopping-list")
router.register(
    r"shopping-list-item", ShoppingListItemViewSet, basename="shopping-list-item"
)
router.register(
    r"shopping-list-store", ShoppingListStoreViewSet, basename="shopping-list-store"
)
router.register(
    r"shopping-list-delegation",
    ShoppingListDelegationViewSet,
    basename="shopping-list-delegation",
)

router.register(
    r"delegated-shopping-list-item",
    DelegatedShoppingListItemViewSet,
    basename="delegated-shopping-list-item",
)

router.register(r"category", CategoriesViewset, basename="category")
router.register(
    r"professional-category",
    ProfessionalCategoriesViewset,
    basename="professional-category",
)
router.register(r"user", UserWithFamilyViewSet, basename="user")
router.register(r"user-simple", UserViewSet, basename="user-simple")
router.register(r"user-minimal", UserMinimalReadonlyViewset, basename="user-minimal")
router.register(
    r"user-id-minimal", UserMinimalIdLookupViewset, basename="user-id-minimal"
)
router.register(
    r"user-email-minimal",
    UserMinimalEmailLookupReadonlyViewset,
    basename="user-email-minimal",
)

router.register(
    r"user-secure-update", UserSecureUpdateViewSet, basename="user-secure-update"
)
router.register(
    r"last-activity-view", LastActivityViewSet, basename="last-activity-view"
)
router.register(r"user-invite", UserInviteViewSet, basename="user-invite")
router.register(r"full-user-invite", FullUserInviteViewSet, basename="full-user-invite")
router.register(r"family", FamilyViewSet, basename="family")
router.register(r"friendship", FriendshipViewset, basename="friendship")
router.register(
    r"category-setup", CategorySetupCompletionViewset, basename="category-setup"
)
router.register(
    r"references-setup", ReferencesSetupCompletionViewset, basename="references-setup"
)

router.register(
    r"entity-type-setup", EntityTypeSetupCompletionViewset, basename="entity-type-setup"
)

router.register(r"tag-setup", TagSetupCompletionViewset, basename="tag-setup")
router.register(
    r"link-list-setup", LinkListSetupCompletionViewset, basename="link-list-setup"
)

router.register(
    r"task_completion_form", TaskCompletionFormViewSet, basename="task_completion_form"
)

router.register(
    r"task_action_completion_form",
    TaskActionCompletionFormViewSet,
    basename="task_action_completion_form",
)


router.register(
    r"family-category-view-permissions",
    FamilyCategoryViewPermissionViewset,
    basename="family-category-view-permissions",
)
router.register(r"preferred-days", PreferredDaysViewset, basename="preferred-days")


router.register(
    r"blocked-days/birthdays",
    BirthdayBlockedCategoryViewset,
    basename="blocked-days-birthdays",
)
router.register(
    r"blocked-days/family-birthdays",
    FamilyBirthdayBlockedCategoryViewset,
    basename="blocked-days-family-birthdays",
)
router.register(
    r"blocked-days/national-holidays",
    NationalHolidaysBlockedCategoryViewset,
    basename="blocked-days-national-holidays",
)
router.register(
    r"blocked-days/term-time",
    TermTimeBlockedCategoryViewset,
    basename="blocked-days-term-time",
)
router.register(
    r"blocked-days/trips", TripBlockedCategoryViewset, basename="blocked-days-trips"
)
router.register(
    r"blocked-days/days-off",
    DaysOffBlockedCategoryViewset,
    basename="blocked-days-days-off",
)

router.register(r"reference", ReferenceViewset, basename="reference")
router.register(r"reference-group", ReferenceGroupViewset, basename="reference-group")
router.register(r"alert", AlertsViewSet, basename="alert")
router.register(r"action-alert", ActionAlertsViewSet, basename="action-alert")

router.register(r"routine", RoutineViewset, basename="routine")
router.register(r"timeblock", TimeBlockViewset, basename="timeblock")

router.register(r"message", MessageViewset, basename="message")

router.register(r"school-year", SchoolYearViewSet, basename="school-year")
router.register(r"school-break", SchoolBreakViewSet, basename="school-break")
router.register(r"school-term", SchoolTermViewSet, basename="school-term")


router.register(
    r"guestlist-invite", GuestListInviteViewSet, basename="guestlist-invite"
)
router.register(
    r"guestlist-invitee-invite",
    GuestListInviteInviteeViewSet,
    basename="guestlist-invitee-invite",
)

urlpatterns = [
    path("mark-alerts-read/", mark_alerts_read, name="mark_alerts_read"),
    path("holidays/countries/", get_countries, name="holiday_countries"),
    path("holidays/country_holidays/", get_holidays, name="holiday_country_holidays"),
    path("password-reference/", retrieve_password_reference, name="password-reference"),
    path("tags/", get_tag_options, name="tags"),
    path("message_threads/", message_threads, name="message_threads"),
    path("tasks/bulk_create/", bulk_create_tasks, name="tasks_bulk_create"),
    path("planning-lists/create_template/", create_template, name="create_template"),
    path(
        "planning-lists/create_from_default_template/",
        create_from_default_template,
        name="create_from_default_template",
    ),
] + router.urls
