from core.models.entities.finance import Finance
from .base import EntityBaseSerializer


class FinanceSerializer(EntityBaseSerializer):
    class Meta:
        model = Finance
        fields = "__all__"
        read_only_fields = ("category", )
