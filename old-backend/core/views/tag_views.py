"""Tag-related views"""
from rest_framework.decorators import api_view
from rest_framework.response import Response

from core.utils.tags import PET_TAGS


@api_view(["GET"])
def get_tag_options(request):
    """Gets the permitted options that can be used as tags"""
    return Response(
        {
            "PETS": PET_TAGS,
        }
    )
