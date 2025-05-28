"""Contact admin"""

from django.contrib import admin

from .models import ContactMessage


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    """ContactMessageAdmin"""

    model = ContactMessage
    list_display = ("id", "email", "created_at")
