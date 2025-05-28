from core.models.entities.pets import Vet, Walker, Groomer, \
    Sitter, MicrochipCompany, InsuranceCompany, InsurancePolicy, Pet
from .base import EntityBaseSerializer
from rest_framework.serializers import CharField


class VetSerializer(EntityBaseSerializer):
    class Meta:
        model = Vet
        fields = "__all__"
        read_only_fields = ("category", )


class WalkerSerializer(EntityBaseSerializer):
    class Meta:
        model = Walker
        fields = "__all__"
        read_only_fields = ("category", )


class GroomerSerializer(EntityBaseSerializer):
    class Meta:
        model = Groomer
        fields = "__all__"
        read_only_fields = ("category", )


class SitterSerializer(EntityBaseSerializer):
    class Meta:
        model = Sitter
        fields = "__all__"
        read_only_fields = ("category", )


class MicrochipCompanySerializer(EntityBaseSerializer):
    class Meta:
        model = MicrochipCompany
        fields = "__all__"
        read_only_fields = ("category", )


class InsuranceCompanySerializer(EntityBaseSerializer):
    class Meta:
        model = InsuranceCompany
        fields = "__all__"
        read_only_fields = ("category", )


class InsurancePolicySerializer(EntityBaseSerializer):
    class Meta:
        model = InsurancePolicy
        fields = "__all__"
        read_only_fields = ("category", )


class PetSerializer(EntityBaseSerializer):
    presigned_image_url = CharField(read_only=True)

    class Meta:
        model = Pet
        fields = "__all__"
        read_only_fields = ("category", )
        extra_kwargs = {
            "image": {
                "write_only": True
            }
        }
