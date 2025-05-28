"""Subscription views"""

import logging
import os
from typing import Dict, Literal, TypedDict, cast

import stripe
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response

from core.models.users.user_models import User
from subscriptions.models import Subscription
from subscriptions.serializers import StripeSubscriptionSerializer

logger = logging.getLogger(__name__)


PRICE_ID_MAPPING = {
    "USER": {
        "MONTHLY": os.getenv("STRIPE_MONTHLY_PRICE_ID"),
        "YEARLY": os.getenv("STRIPE_YEARLY_PRICE_ID"),
    },
    "FAMILY": {
        "MONTHLY": os.getenv("STRIPE_FAMILY_MONTHLY_PRICE_ID"),
        "YEARLY": os.getenv("STRIPE_FAMILY_YEARLY_PRICE_ID"),
    },
}


class Product(TypedDict):
    """Product"""

    type: Literal["MONTHLY", "YEARLY"]
    family: bool


PRICE_ID_REVERSE_MAPPING: Dict[str, Product] = {
    os.getenv("STRIPE_MONTHLY_PRICE_ID", ""): {
        "type": "MONTHLY",
        "family": False,
    },
    os.getenv("STRIPE_YEARLY_PRICE_ID", ""): {
        "type": "YEARLY",
        "family": False,
    },
    os.getenv("STRIPE_FAMILY_MONTHLY_PRICE_ID", ""): {
        "type": "MONTHLY",
        "family": True,
    },
    os.getenv("STRIPE_FAMILY_YEARLY_PRICE_ID", ""): {
        "type": "YEARLY",
        "family": True,
    },
}

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def create_checkout_session(request):
    """Create a checkout session"""
    is_family = bool(request.data.get("is_family"))
    subscription_type = request.data.get("type")
    user_type = "FAMILY" if is_family else "USER"
    price_id = PRICE_ID_MAPPING[user_type][subscription_type]
    user_id = request.data.get("user_id")
    user = cast(User, request.user)

    if not user.id == user_id:
        return Response(
            {"error": "Invalid user_id", "code": "invalid_user_id"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if user.subscriptions and user.subscriptions.exists():
        return Response(
            {"error": "User has subscription", "code": "user_has_subscription"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    web_url = os.getenv("WEB_URL")

    session = stripe.checkout.Session.create(
        success_url=f"{web_url}/account?session_id=" + "{CHECKOUT_SESSION_ID}",
        cancel_url=f"{web_url}/account",
        mode="subscription",
        line_items=[
            {
                "price": price_id,
                "quantity": 1,
            }
        ],
        metadata={
            "user_id": user_id,
            "type": subscription_type,
            "is_family": is_family,
        },
    )

    return Response({"url": session.url})


@api_view(["GET", "POST"])
def stripe_webhook(request):
    """A webhook to handle stripe events.

    Stripe requires a 2xx status code otherwise it will disable the webhook.
    """
    if request.method == "GET":
        return Response({"status": "healthy"})

    wh_key = os.getenv("STRIPE_WHSEC")
    if not wh_key:
        return Response(
            {
                "error": "no-stripe-wh-key",
                "message": "There is no Stripe webhook security key defined in the current environment",
            },
            status=status.HTTP_202_ACCEPTED,
        )

    signature = request.META.get("HTTP_STRIPE_SIGNATURE", "")
    if not signature:
        return Response(
            {
                "error": "no-signature",
                "message": "There is no Stripe signature defined in this request",
            },
            status=status.HTTP_202_ACCEPTED,
        )

    event = stripe.Webhook.construct_event(request.body, signature, wh_key)

    if event.type == "checkout.session.completed":
        metadata = event.data.object.metadata
        user_id = metadata.get("user_id")
        subscription_type = metadata.get("type")
        is_family = metadata.get("is_family")
        user = User.objects.get(pk=user_id)

        Subscription.objects.create(
            user=user,
            customer_id=request.data["data"]["object"]["customer"],
            subscription_id=request.data["data"]["object"]["subscription"],
            type=subscription_type,
            is_family=is_family,
        )

        return Response({"success": True}, status=status.HTTP_201_CREATED)

    if event.type == "customer.subscription.deleted":
        subscription_id = request.data["data"]["object"]["id"]
        Subscription.objects.filter(
            subscription_id=subscription_id,
        ).delete()

        return Response({"success": True}, status=status.HTTP_201_CREATED)

    if event.type == "customer.subscription.updated":
        price_id = request.data["data"]["object"]["plan"]["id"]
        subscription_id = request.data["data"]["object"]["id"]
        product = PRICE_ID_REVERSE_MAPPING[price_id]
        Subscription.objects.filter(
            subscription_id=subscription_id,
        ).update(paused=False, is_family=product["family"])
        return Response({"success": True}, status=status.HTTP_201_CREATED)

    if event.type == "invoice.paid":
        Subscription.objects.filter(
            subscription_id=request.data["data"]["object"]["subscription"],
        ).update(paused=False)

    if event.type == "invoice.payment_failed":
        Subscription.objects.filter(
            subscription_id=request.data["data"]["object"]["subscription"],
        ).update(paused=True)

    return Response({"success": True}, status=status.HTTP_200_OK)


@api_view(["GET"])
def get_subscriptions(request: Request):
    """get_subscriptions"""
    user_id = request.GET.get("user_id")
    if not user_id:
        return Response(
            {"error": "No user_id", "code": "no_user_id"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = cast(User, request.user)
    if not user.pk == int(user_id):
        return Response(
            {"error": "Invalid user_id", "code": "invalid_user_id"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    subscriptions = (
        list(
            Subscription.objects.filter(
                Q(user=user) | (Q(user__in=user.family.users.all()) & Q(is_family=True))
            )
        )
        if user.family
        else Subscription.objects.filter(user=user)
    )

    stripe_subscriptions = [
        stripe.Subscription.retrieve(subscription.subscription_id)
        for subscription in subscriptions
    ]
    stripe_customers = [
        stripe.Customer.retrieve(subscription.customer_id)
        for subscription in subscriptions
    ]

    serializer = StripeSubscriptionSerializer(
        [
            {
                "current_period_end": stripe_subscription.current_period_end,
                "cancel_at_period_end": stripe_subscription.cancel_at_period_end,
                "type": subscription.type,
                "customer_email": stripe_customer.email,
                "is_family": subscription.is_family,
                "user": subscription.user.pk,
            }
            for stripe_subscription, stripe_customer, subscription in zip(
                stripe_subscriptions,
                stripe_customers,
                subscriptions,
            )
        ],
        many=True,
    )

    return Response(serializer.data, status=status.HTTP_200_OK)
