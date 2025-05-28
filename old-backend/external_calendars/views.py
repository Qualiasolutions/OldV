"""External calendar views"""

from typing import cast

from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import ModelViewSet

from core.models.users.user_models import User
from external_calendars.models import ICalIntegration
from external_calendars.serializers import ICalIntegrationSerializer


class ICalIntegrationViewSet(ModelViewSet):
    """ICalIntegrationViewSet"""

    serializer_class = ICalIntegrationSerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return ICalIntegration.objects.filter(user=user)
