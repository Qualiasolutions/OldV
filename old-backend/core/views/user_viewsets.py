"""User viewsets"""
from typing import cast

from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.mixins import (
    CreateModelMixin,
    ListModelMixin,
    RetrieveModelMixin,
    UpdateModelMixin,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.viewsets import GenericViewSet, ModelViewSet, ReadOnlyModelViewSet

from core.models.users.user_models import (
    CategorySetupCompletion,
    EntityTypeSetupCompletion,
    Family,
    Friendship,
    LastActivityView,
    LinkListSetupCompletion,
    ReferencesSetupCompletion,
    TagSetupCompletion,
    User,
    UserInvite,
)
from core.serializers.users import (
    CategorySetupCompletionSerializer,
    EntityTypeSetupCompletionSerializer,
    FamilySerializer,
    FriendshipSerializer,
    FullUserInviteSerializer,
    LastActivityViewSerializer,
    LinkListSetupCompletionSerializer,
    ReferencesSetupCompletionSerializer,
    TagSetupCompletionSerializer,
    UserInviteSerializer,
    UserMinimalSerializer,
    UserSecureUpdateSerializer,
    UserSerializer,
    UserWithFamilySerializer,
)


class UserMinimalReadonlyViewset(RetrieveModelMixin, GenericViewSet):
    """UserMinimalReadonlyViewset"""

    serializer_class = UserMinimalSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    lookup_field = "phone_number"

    def get_queryset(self):
        return get_user_model().objects.all()


class UserMinimalEmailLookupReadonlyViewset(RetrieveModelMixin, GenericViewSet):
    """UserMinimalEmailLookupReadonlyViewset"""

    serializer_class = UserMinimalSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    lookup_field = "email"

    def get_queryset(self):
        return get_user_model().objects.all()


class UserMinimalIdLookupViewset(RetrieveModelMixin, GenericViewSet):
    """UserMinimalIdLookupViewset"""

    serializer_class = UserMinimalSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return get_user_model().objects.all()


class UserWithFamilyViewSet(ModelViewSet):
    """UserWithFamilyViewSet"""

    serializer_class = UserWithFamilySerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return get_user_model().objects.filter(pk=self.request.user.pk)


class UserViewSet(ModelViewSet):
    """UserViewSet"""

    serializer_class = UserSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return get_user_model().objects.filter(pk=self.request.user.pk)


class LastActivityViewSet(ModelViewSet):
    """LastActivityViewSet"""

    serializer_class = LastActivityViewSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return LastActivityView.objects.filter(user=user)


class UserSecureUpdateViewSet(UpdateModelMixin, GenericViewSet):
    """A viewset for updating the current user, requiring the current password"""

    serializer_class = UserSecureUpdateSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return User.objects.all()


class CategorySetupCompletionViewset(CreateModelMixin, ListModelMixin, GenericViewSet):
    """A viewset for marking category setups as complete"""

    serializer_class = CategorySetupCompletionSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return CategorySetupCompletion.objects.filter(user=user)


class ReferencesSetupCompletionViewset(
    CreateModelMixin, ListModelMixin, GenericViewSet
):
    """A viewset for marking references setup as complete"""

    serializer_class = ReferencesSetupCompletionSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return ReferencesSetupCompletion.objects.filter(user=user)


class EntityTypeSetupCompletionViewset(
    CreateModelMixin, ListModelMixin, GenericViewSet
):
    """A viewset for marking entity type setup as complete"""

    serializer_class = EntityTypeSetupCompletionSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return EntityTypeSetupCompletion.objects.filter(user=user)


class TagSetupCompletionViewset(CreateModelMixin, ListModelMixin, GenericViewSet):
    """A viewset for marking tag setup as complete"""

    serializer_class = TagSetupCompletionSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return TagSetupCompletion.objects.filter(user=user)


class LinkListSetupCompletionViewset(CreateModelMixin, ListModelMixin, GenericViewSet):
    """A viewset for marking link list setup as complete"""

    serializer_class = LinkListSetupCompletionSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return LinkListSetupCompletion.objects.filter(user=user)


class FamilyViewSet(
    ListModelMixin, RetrieveModelMixin, UpdateModelMixin, GenericViewSet
):
    """FamilyViewSet"""

    serializer_class = FamilySerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return Family.objects.filter(users__pk=self.request.user.pk).distinct()


class UserInviteViewSet(ModelViewSet):
    """UserInviteViewSet"""

    serializer_class = UserInviteSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return UserInvite.objects.filter(
            Q(family=user.family) | Q(phone_number=user.phone_number) | Q(invitee=user)
        )


class FullUserInviteViewSet(ReadOnlyModelViewSet):
    """FullUserInviteViewSet"""

    serializer_class = FullUserInviteSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return UserInvite.objects.prefetch_related(
            "invitee",
            "family",
        ).filter(
            Q(family=user.family) | Q(phone_number=user.phone_number) | Q(invitee=user)
        )


class FriendshipViewset(ModelViewSet):
    """FriendshipViewset"""

    serializer_class = FriendshipSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        return Friendship.objects.filter(
            Q(friend=self.request.user) | Q(creator=self.request.user)
        )
