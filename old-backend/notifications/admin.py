from django.contrib import admin
from .models import PushToken


@admin.register(PushToken)
class NotificationsAdmin(admin.ModelAdmin):
    model = PushToken
    list_display = ('user__username', 'token', 'active')

    def user__username(self, obj):
        return obj.user.username
