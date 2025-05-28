"""user model signals"""

import logging

from django.conf import settings
from django.db.models.signals import post_save
from twilio.rest import Client

from notifications.utils.send_notification import send_push_message_if_valid
from utils.email_client import EmailClient

from .user_models import User, UserInvite

logger = logging.getLogger(__name__)


def user_invite_post_save(sender, instance, created, **kwargs):
    """When a UserInvite object is created we should send an SMS
    to the associated phone number. Existing users should receive
    a push notification.
    """
    if created:
        invite_type = "family" if instance.family else "circle"

        is_email = bool(instance.email)

        existing_users = (
            User.objects.filter(email=instance.email)
            if is_email
            else User.objects.filter(phone_number=instance.phone_number)
        )

        invitee_full_name = (
            f"{instance.invitee.first_name} {instance.invitee.last_name}"
        )

        sms_client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
        email_client = EmailClient()
        if existing_users.exists():
            existing_user = existing_users[0]

            if is_email:
                email_client.send_email(
                    "You have been invited to a family",
                    "family-invite-existing.html",
                    instance.email,
                    plaintext_template="family-invite-existing.txt",
                    data={
                        "inviter_name": invitee_full_name,
                        "invitee_name": existing_user.first_name,
                    },
                )
            else:
                sms_client.messages.create(
                    to=str(instance.phone_number),
                    from_=settings.TWILIO_FROM_NUMBER,
                    body=f"Hello {existing_user.first_name}!\n\n{invitee_full_name} has invited you to their Vuet {invite_type}.\nLog in to your account now to join them!",
                )

            tokens = existing_user.push_tokens.all()
            for token in tokens:
                message = (
                    f"{invitee_full_name} has added you to their family!"
                    if invite_type == "family"
                    else f"{invitee_full_name} has added you to their Vuet circle!"
                )
                send_push_message_if_valid(token, message)
        else:
            if is_email:
                email_client.send_email(
                    "You have been invited to join Vuet",
                    "family-invite-new.html",
                    instance.email,
                    plaintext_template="family-invite-new.txt",
                    data={
                        "inviter_name": invitee_full_name,
                    },
                )
            else:
                sms_client.messages.create(
                    to=str(instance.phone_number),
                    from_=settings.TWILIO_FROM_NUMBER,
                    body=f"Hello {instance.first_name}!\n\n{invitee_full_name} has invited you to their Vuet {invite_type}.\n\nDownload the app from the app store now and sign up with the phone number ending {str(instance.phone_number)[-4:]} to join them!",
                )


post_save.connect(user_invite_post_save, sender=UserInvite)
