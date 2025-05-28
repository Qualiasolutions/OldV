"""Email models"""
from django.db import models


class Email(models.Model):
    """Email"""

    env = models.CharField(max_length=20, null=False, blank=False, default="")
    time = models.DateTimeField(auto_now_add=True)
    to = models.EmailField(max_length=200, null=False, blank=False)
    from_email = models.CharField(
        max_length=200, null=False, blank=False, db_column="from"
    )
    html = models.TextField(null=False, blank=False)
    subject = models.CharField(max_length=255, null=False, blank=False)
