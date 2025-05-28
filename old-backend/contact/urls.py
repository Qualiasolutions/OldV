from rest_framework.routers import DefaultRouter

from .views import ContactMessageViewSet

router = DefaultRouter()
router.register(r"message", ContactMessageViewSet, basename="message")

urlpatterns = router.urls
