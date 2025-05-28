"""Ensure that the database is set up appropriately for running
the E2E Appium tests. It would be nice to have the Django ORM
accessible during testing but unfortunately this is not possible
"""

from core.models.users.user_models import User


test_phone_number = "+447123123123"
User.objects.filter(phone_number=test_phone_number).delete()
User.objects.filter(username=test_phone_number).delete()
