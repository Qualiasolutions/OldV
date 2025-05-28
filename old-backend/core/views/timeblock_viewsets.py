from typing import cast

from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from core.models.timeblocks.timeblocks import TimeBlock
from core.models.users.user_models import User
from core.serializers.timeblocks import TimeBlockSerializer
from subscriptions.models import Subscription


class TimeBlockViewset(ModelViewSet):
    """TimeBlockViewset"""

    serializer_class = TimeBlockSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = cast(User, self.request.user)
        is_premium = (
            user.family
            and Subscription.objects.filter(
                Q(user=user) | (Q(user__in=user.family.users.all()) & Q(is_family=True))
            ).exists()
        )
        if not is_premium:
            return []

        return TimeBlock.objects.filter(members=user).distinct()
