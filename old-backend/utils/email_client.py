"""A client for sending emails"""
import logging
import os
from typing import List, Optional, TypedDict

from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.timezone import now

from core.models.emails.emails import Email
from vuet.settings import EMAIL_HOST_PASSWORD, EMAIL_REDIRECT_ADDRESS

logger = logging.getLogger(__name__)


class Attachment(TypedDict):
    """Attachment"""

    name: str
    content: bytes


class EmailClient:
    """EmailClient"""

    def __init__(self):
        """__init__"""
        self.enabled = bool(EMAIL_HOST_PASSWORD)
        self.redirect_address = EMAIL_REDIRECT_ADDRESS

    def send_email(
        self,
        title: str,
        template: str,
        to_email: str,
        plaintext_template: Optional[str] = None,
        from_email: str = "Vuet<contact@vuet.app>",
        data: Optional[dict] = None,
        attachments: Optional[List[Attachment]] = None,
    ):
        """send_email"""
        content = render_to_string(template, data or {})

        if self.enabled:
            to_email_address = self.redirect_address or to_email
            mail = EmailMultiAlternatives(
                title, plaintext_template or content, from_email, [to_email_address]
            )
            mail.attach_alternative(content, "text/html")
            if attachments:
                for attachment in attachments:
                    mail.attach(attachment["name"], attachment["content"])
            mail.send()

        Email.objects.create(  # type: ignore
            env=os.environ.get("ENV"),
            time=now(),
            to=to_email,
            from_email=from_email,
            html=content,
            subject=title,
        )

    def send_admin_email(
        self,
        title: str,
        template: str,
        plaintext_template: Optional[str] = None,
        from_email: str = "Vuet<contact@vuet.app>",
        data: Optional[dict] = None,
        attachments: Optional[List[Attachment]] = None,
    ):
        """send_admin_email"""
        self.send_email(
            title,
            template,
            "contact@vuet.app",
            plaintext_template=plaintext_template,
            from_email=from_email,
            data=data,
            attachments=attachments,
        )
