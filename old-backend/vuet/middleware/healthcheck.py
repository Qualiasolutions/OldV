from django.http import HttpResponse
from django.utils.deprecation import MiddlewareMixin

# We need a middleware to go before the ALLOWED_HOSTS check
# so that the ALB healthchecks can succeed
class HealthCheckMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.META["PATH_INFO"] == "/health/":
            return HttpResponse("healthy")
