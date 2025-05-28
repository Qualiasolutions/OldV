"""Subscription URLs"""

from django.urls import path

from subscriptions.views import (
    create_checkout_session,
    get_subscriptions,
    stripe_webhook,
)

urlpatterns = [
    path(
        "create-checkout-session/",
        create_checkout_session,
        name="create_checkout_session",
    ),
    path("webhook/", stripe_webhook, name="stripe_webhook"),
    path("get-subscriptions/", get_subscriptions, name="get_subscriptions"),
]
