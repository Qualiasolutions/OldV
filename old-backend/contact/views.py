from rest_framework.mixins import CreateModelMixin
from rest_framework.permissions import IsAuthenticated
from rest_framework.viewsets import GenericViewSet

from .serializers import ContactMessageSerializer


class ContactMessageViewSet(CreateModelMixin, GenericViewSet):
    """ContactMessageViewSet"""

    serializer_class = ContactMessageSerializer
    permission_classes = [
        IsAuthenticated,
    ]
