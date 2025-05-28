import logging

import pytz
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

import django

django.setup()

from core.models.users.user_models import User
from notifications.models import PushToken
from notifications.views import PushTokenViewSet

utc = pytz.UTC


class TestPushTokenViewSet(TestCase):
    def test_create_push_token(self):
        test_token = "ASDASDASD"
        user = User.objects.create(phone_number="+447814187441")
        existing_token = PushToken.objects.create(token="SDFSDFSDF", user=user)

        # Existing token should start off active
        self.assertTrue(existing_token.active)

        create_view = PushTokenViewSet.as_view({"post": "create"})

        # Valid request gives 201 response and tokens
        request = APIRequestFactory().post("", {"token": test_token}, format="json")
        force_authenticate(request, user=user)

        res = create_view(request)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(
            res.data,
            {
                "token": test_token,
                "active": True,
                "user": user.id,
                "id": res.data["id"],
                "last_active": res.data["last_active"],
            },
        )

        # Existing token should still be active
        existing_token = PushToken.objects.get(id=existing_token.id)
        self.assertTrue(existing_token.active)

    def test_update_push_token(self):
        test_token = "ASDASDASD"
        user = User.objects.create(phone_number="+447814187441")
        existing_token = PushToken.objects.create(token=test_token, user=user)

        creation_time = existing_token.last_active

        # Existing token should start off active
        self.assertTrue(existing_token.active)

        update_view = PushTokenViewSet.as_view({"patch": "partial_update"})

        # Valid request gives 200 response and tokens
        request = APIRequestFactory().patch("", {"active": False}, format="json")
        force_authenticate(request, user=user)

        res = update_view(request, pk=existing_token.id)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            res.data,
            {
                "token": test_token,
                "active": False,
                "user": user.id,
                "id": res.data["id"],
                "last_active": res.data["last_active"],
            },
        )

        # Existing token should be deactivated
        existing_token = PushToken.objects.get(id=existing_token.id)
        self.assertFalse(existing_token.active)
        self.assertTrue(existing_token.last_active > creation_time)  # type: ignore
