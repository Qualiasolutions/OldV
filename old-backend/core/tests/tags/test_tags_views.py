"""Tests for tag views"""

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory

from core.views.tag_views import get_tag_options


class TestTagsViews(TestCase):
    """Tests for tag views"""

    def test_get_tags(self):
        """Test that we can get a success response"""
        req = APIRequestFactory().get("")
        res = get_tag_options(req)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res.data["PETS"])
