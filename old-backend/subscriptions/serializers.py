"""Subscription serializers"""

from rest_framework import serializers


class StripeSubscriptionSerializer(serializers.Serializer):
    """StripeSubscriptionSerializer"""

    current_period_end = serializers.IntegerField()
    cancel_at_period_end = serializers.BooleanField()
    is_family = serializers.BooleanField()
    type = serializers.CharField()
    customer_email = serializers.CharField()
    user = serializers.IntegerField()
