"""Tests for reference viewset"""
from datetime import date

from django.test import TestCase
from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

from core.models.entities.education import School, SchoolYear
from core.models.users.user_models import User
from core.views.entity_viewsets import SchoolBreakViewSet, SchoolYearViewSet


class TestSchoolYearViewset(TestCase):
    """TestSchoolYearViewset"""

    def setUp(self):
        self.create_view = SchoolYearViewSet.as_view({"post": "create"})
        self.user = User.objects.create(
            phone_number="07123123123", username="07123123123"
        )
        self.school = School.objects.create(name="MY_SCHOOL", owner=self.user)
        self.school.members.add(self.user)

    def test_can_create_school_year_viewset(self):
        """Test that we can create school terms using the viewset"""

        req = APIRequestFactory().post(
            "",
            {
                "school": self.school.id,
                "year": "2023/2024",
                "start_date": "2023-09-06",
                "end_date": "2024-06-15",
            },
        )

        force_authenticate(req, self.user)

        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)


class TestSchoolBreakViewset(TestCase):
    """TestSchoolBreakViewset"""

    def setUp(self):
        self.create_view = SchoolBreakViewSet.as_view({"post": "create"})
        self.user = User.objects.create(
            phone_number="07123123123", username="07123123123"
        )
        self.school = School.objects.create(name="MY_SCHOOL", owner=self.user)
        self.school.members.add(self.user)

        self.school_year = SchoolYear.objects.create(
            school=self.school,
            year="2023/2024",
            start_date=date(year=2023, month=9, day=6),
            end_date=date(year=2024, month=9, day=6),
        )

    def test_can_create_school_year_viewset(self):
        """Test that we can create school terms using the viewset"""

        req = APIRequestFactory().post(
            "",
            {
                "school_year": self.school_year.id,
                "start_date": "2023-09-06",
                "end_date": "2024-06-15",
            },
        )

        force_authenticate(req, self.user)

        res = self.create_view(req)

        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
