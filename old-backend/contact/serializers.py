"""Contact serializers"""

from rest_framework.serializers import ModelSerializer

from utils.email_client import EmailClient

from .models import ContactMessage


class ContactMessageSerializer(ModelSerializer):
    """ContactMessageSerializer"""

    class Meta:
        model = ContactMessage
        fields = "__all__"

    def create(self, validated_data):
        """When we create a contact message we should email it to Vuet admin"""
        contact_message: ContactMessage = super().create(validated_data)

        email_client = EmailClient()
        email_client.send_admin_email(
            "New message from contact form",
            "admin-contact-message.html",
            plaintext_template="admin-contact-message.txt",
            data={
                "message": contact_message.message,
                "email": contact_message.email,
            },
        )
        return contact_message
