"""Register subscription models"""

from django.contrib import admin

from subscriptions.models import Subscription


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    """SubscriptionAdmin"""

    model = Subscription
    list_display = (
        "id",
        "user__username",
    )

    def user__username(self, obj):
        """user__username"""
        return obj.user.username
