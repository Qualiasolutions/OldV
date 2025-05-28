from django.db import models
from phonenumber_field.modelfields import PhoneNumberField  # type: ignore

from core.utils.categories import Categories
from core.utils.presigned_urls import get_or_create_presigned_url

from .base import Entity


class PetsEntity(Entity):
    def save(self, **kwargs):
        self.category = Categories.PETS.value
        return super().save(**kwargs)

    class Meta:
        abstract = True


class Vet(PetsEntity):
    phone_number = PhoneNumberField(null=True, blank=True)
    email = models.CharField(null=False, blank=True, max_length=100)


class Walker(PetsEntity):
    phone_number = PhoneNumberField(null=True, blank=True)
    email = models.CharField(null=False, blank=True, max_length=100)


class Groomer(PetsEntity):
    phone_number = PhoneNumberField(null=True, blank=True)
    email = models.CharField(null=False, blank=True, max_length=100)


class Sitter(PetsEntity):
    phone_number = PhoneNumberField(null=True, blank=True)
    email = models.CharField(null=False, blank=True, max_length=100)


class MicrochipCompany(PetsEntity):
    account_number = models.CharField(null=False, blank=True, max_length=100)
    phone_number = PhoneNumberField(null=True, blank=True)
    email = models.CharField(null=False, blank=True, max_length=100)


class InsuranceCompany(PetsEntity):
    phone_number = PhoneNumberField(null=True, blank=True)
    email = models.CharField(null=False, blank=True, max_length=100)


class InsurancePolicy(PetsEntity):
    company = models.ForeignKey(
        InsuranceCompany, null=False, blank=False, on_delete=models.CASCADE
    )
    account_number = models.CharField(null=False, blank=True, max_length=100)


def pet_image_upload_location(instance, filename):
    ext = filename.split(".")[-1]
    return f"pets/images/{instance.id}.{ext}"


class Pet(PetsEntity):
    type = models.CharField(null=False, blank=True, max_length=100)
    breed = models.CharField(null=False, blank=True, max_length=100)
    dob = models.DateField(null=True, blank=True)
    microchip_number = models.CharField(null=False, blank=True, max_length=100)
    microchip_company = models.ForeignKey(
        MicrochipCompany, null=True, blank=True, on_delete=models.CASCADE
    )
    pet_vet = models.ForeignKey(Vet, null=True, blank=True, on_delete=models.CASCADE)
    pet_walker = models.ForeignKey(
        Walker, null=True, blank=True, on_delete=models.CASCADE
    )
    pet_groomer = models.ForeignKey(
        Groomer, null=True, blank=True, on_delete=models.CASCADE
    )
    pet_sitter = models.ForeignKey(
        Sitter, null=True, blank=True, on_delete=models.CASCADE
    )
    insurance_policy = models.ForeignKey(
        InsurancePolicy, null=True, blank=True, on_delete=models.CASCADE
    )

    def presigned_image_url(self):
        return get_or_create_presigned_url(
            self, "image_200_200", f"family-{self.id}-{self.image.name}-image-200-200"
        )
