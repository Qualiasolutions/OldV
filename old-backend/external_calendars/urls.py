"""External calendar URLs"""

from rest_framework.routers import DefaultRouter

from .views import ICalIntegrationViewSet

router = DefaultRouter()
router.register(
    r"ical-integration", ICalIntegrationViewSet, basename="ical_integration"
)

urlpatterns = router.urls
