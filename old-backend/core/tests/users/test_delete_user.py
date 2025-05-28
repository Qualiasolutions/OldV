from django.test import TestCase
from core.models.users.user_models import User
from vuet_auth.models.phone_validations import PhoneValidation
from vuet_auth.serializers.register import RegisterSerializer


class TestDeleteUser(TestCase):
    def test_create_then_delete(self):
        # Create an owner
        test_phone = "+447814187440"
        user = User.objects.create(phone_number=test_phone, username=test_phone)
        # Just need this not to error
        User.objects.filter(phone_number=test_phone).delete()

    def test_delete_user_from_register_serializer(self):
        """Test that a user created from the RegisterSerializer serializer
        can be deleted
        """

        test_phone = "+447814187440"
        PhoneValidation.objects.create(
            phone_number=test_phone,
            code="123123",
            validated=True
        )
        serializer = RegisterSerializer(data={
            "phone_number": test_phone,
            "password": "test",
            "password2": "test",
        })

        self.assertTrue(serializer.is_valid(raise_exception=True))
        user = serializer.create(serializer.validated_data)

        self.assertEqual(User.objects.filter(phone_number=test_phone).count(), 1)

        # Just need this not to error
        User.objects.filter(phone_number=test_phone).delete()
