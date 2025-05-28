"""Tests for holiday views"""
import dateutil
import holidays as pyholidays
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory

from core.views.holidays_views import get_countries, get_holidays


class HolidayViewTests(TestCase):
    """HolidayViewTests"""

    def test_get_countries(self):
        """test_get_countries"""
        request = APIRequestFactory().get("")
        res = get_countries(request)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            [country["code"] for country in res.data],
            list(pyholidays.list_supported_countries().keys()),
        )

    def test_get_holidays(self):
        """test_get_holidays"""
        request = APIRequestFactory().get(
            "", {"country_codes": ["GB"], "years": [2022]}
        )
        res = get_holidays(request)

        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(
            res.data["GB"][0],
            {
                "name": "New Year's Day",
                "start_date": str(dateutil.parser.parse("2022-01-01").date()),
                "end_date": str(dateutil.parser.parse("2022-01-01").date()),
                "id": "GB_2022-01-01_new-year-s-day",
                "country_code": "GB",
            },
        )
