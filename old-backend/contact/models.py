"""Contact models"""
from django.db import models


class ContactMessage(models.Model):
    """ContactMessage"""

    message = models.CharField(max_length=1024, blank=False, null=False)
    email = models.EmailField(max_length=254, blank=False, null=False)
    created_at = models.DateTimeField(null=False, blank=False, auto_now_add=True)
