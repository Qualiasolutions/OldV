"""Category viewsets"""

from typing import cast

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet, ViewSet

from core.models.categories.categories import ProfessionalCategory
from core.models.users.user_models import User
from core.serializers.categories import (
    CategoryConfigSerializer,
    ProfessionalCategorySerializer,
)
from core.utils.categories import Categories, get_category_settings


class CategoriesViewset(ViewSet):
    """
    A viewset to retrieve hardcoded category information
    """

    def retrieve(self, request, pk=None):
        category = get_category_settings(pk)
        serializer = CategoryConfigSerializer(category)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def list(self, request):
        categories = [get_category_settings(pk) for pk in [e.value for e in Categories]]
        serializer = CategoryConfigSerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ProfessionalCategoriesViewset(ModelViewSet):
    """ProfessionalCategoriesViewset"""

    serializer_class = ProfessionalCategorySerializer
    permission_classes = [
        IsAuthenticated,
    ]

    def get_queryset(self):
        user = cast(User, self.request.user)
        return ProfessionalCategory.objects.all().filter(user=user).distinct()
