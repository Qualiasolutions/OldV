from rest_framework.routers import DefaultRouter
from .views import PushTokenViewSet

router = DefaultRouter()
router.register(r'push-token', PushTokenViewSet, basename='push_token')

urlpatterns = router.urls
