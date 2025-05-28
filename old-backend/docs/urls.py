from django.urls import path, re_path
from django.views.generic import TemplateView
from drf_yasg import openapi
from drf_yasg.generators import OpenAPISchemaGenerator
from drf_yasg.views import get_schema_view
from rest_framework.permissions import IsAdminUser

schema_view = get_schema_view(
    openapi.Info(
        title="Vuet API Documentation",
        default_version="v1",
        description="This is a document of the functionality currently available on the Vuet API",
    ),
    public=True,
    permission_classes=[
        IsAdminUser,
    ],
    generator_class=OpenAPISchemaGenerator,
)

urlpatterns = [
    re_path(
        r"^swagger(?P<format>\.json|\.yaml)$",
        schema_view.without_ui(cache_timeout=0),
        name="schema-json",
    ),
    re_path(
        r"^swagger/$",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    re_path(
        r"^redoc/$", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"
    ),
]
