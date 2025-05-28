"""Auth admin models"""
from django.contrib import admin

from vuet_auth.models.email_validations import EmailValidation
from vuet_auth.models.forgot_password_validations import ForgotPasswordValidation

from .models.phone_validations import PhoneValidation

admin.site.register(PhoneValidation)
admin.site.register(EmailValidation)
admin.site.register(ForgotPasswordValidation)
