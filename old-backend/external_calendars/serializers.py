"""External calendar serializers"""

import icalendar  # type: ignore
import requests
from rest_framework.serializers import ModelSerializer, ValidationError

from core.serializers.mixins.validate_user import ValidateUserMixin

from .models import ICalIntegration


class ICalIntegrationSerializer(ValidateUserMixin, ModelSerializer):
    """ICalIntegrationSerializer"""

    class Meta:
        model = ICalIntegration
        fields = "__all__"
        extra_kwargs = {"ical_url": {"write_only": True}}

    def create(self, validated_data, *args, **kwargs):
        ical_url = validated_data["ical_url"]

        new_integration = None

        try:
            res = requests.get(ical_url, timeout=60)
            calendar = icalendar.Calendar.from_ical(res.content)
            ical_name = calendar.get("X-WR-CALNAME")
            ical_type = "UNKNOWN"
            if "google" in calendar.get("PRODID", "").lower():
                ical_type = "GOOGLE"

            validated_data["ical_name"] = ical_name
            validated_data["ical_type"] = ical_type

            new_integration = super().create(validated_data)

        except Exception as exc:
            raise ValidationError("Could not create ICalIntegration") from exc

        if new_integration:
            try:
                new_integration.sync_ical()
                return new_integration
            except Exception as exc:
                new_integration.delete()
                raise ValidationError("Could not sync ICal") from exc
