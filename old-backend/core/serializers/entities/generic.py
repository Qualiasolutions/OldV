"""Generic entity serializers"""

from rest_polymorphic.serializers import PolymorphicSerializer  # type: ignore

from core.models.entities.anniversaries import Anniversary, Birthday
from core.models.entities.base import Entity, ProfessionalEntity
from core.models.entities.career import CareerGoal, DaysOff, Employee
from core.models.entities.education import (  # SchoolBreak,
    AcademicPlan,
    ExtracurricularPlan,
    School,
    Student,
)
from core.models.entities.finance import Finance
from core.models.entities.food import FoodPlan
from core.models.entities.garden import Garden
from core.models.entities.health import Appointment, HealthBeauty, HealthGoal, Patient
from core.models.entities.home import Home
from core.models.entities.laundry import LaundryPlan
from core.models.entities.lists import List
from core.models.entities.pets import (
    Groomer,
    InsuranceCompany,
    InsurancePolicy,
    MicrochipCompany,
    Pet,
    Sitter,
    Vet,
    Walker,
)
from core.models.entities.social import (
    AnniversaryPlan,
    Event,
    EventSubentity,
    Hobby,
    Holiday,
    HolidayPlan,
    SocialMedia,
    SocialPlan,
)
from core.models.entities.transport import Boat, Car, PublicTransport
from core.models.entities.travel import TravelPlan, Trip
from core.serializers.entities.finance import FinanceSerializer
from core.serializers.entities.food import FoodPlanSerializer
from core.serializers.entities.garden import GardenSerializer
from core.serializers.entities.health import (
    AppointmentSerializer,
    HealthBeautySerializer,
    HealthGoalSerializer,
    PatientSerializer,
)
from core.serializers.entities.home import HomeSerializer
from core.serializers.entities.laundry import LaundryPlanSerializer
from core.serializers.entities.pets import (
    GroomerSerializer,
    InsuranceCompanySerializer,
    InsurancePolicySerializer,
    MicrochipCompanySerializer,
    PetSerializer,
    SitterSerializer,
    VetSerializer,
    WalkerSerializer,
)

from .base import EntityBaseSerializer, ProfessionalEntitySerializer
from .career import CareerGoalSerializer, DaysOffSerializer, EmployeeSerializer
from .education import (
    AcademicPlanSerializer,
    ExtracurricularPlanSerializer,
    SchoolSerializer,
    StudentSerializer,
)
from .lists import ListSerializer
from .social import (
    AnniversaryPlanSerializer,
    AnniversarySerializer,
    BirthdaySerializer,
    EventSerializer,
    EventSubentitySerializer,
    HobbySerializer,
    HolidayPlanSerializer,
    HolidaySerializer,
    SocialMediaSerializer,
    SocialPlanSerializer,
)
from .transport import BoatSerializer, CarSerializer, PublicTransportSerializer
from .travel import TravelPlanSerializer, TripSerializer


class EntitySerializer(PolymorphicSerializer):
    """EntitySerializer"""

    base_serializer_class = EntityBaseSerializer
    model_serializer_mapping = {
        Entity: EntityBaseSerializer,
        ProfessionalEntity: ProfessionalEntitySerializer,
        Car: CarSerializer,
        Boat: BoatSerializer,
        PublicTransport: PublicTransportSerializer,
        Event: EventSerializer,
        EventSubentity: EventSubentitySerializer,
        List: ListSerializer,
        Birthday: BirthdaySerializer,
        Anniversary: AnniversarySerializer,
        Hobby: HobbySerializer,
        Holiday: HolidaySerializer,
        HolidayPlan: HolidayPlanSerializer,
        AnniversaryPlan: AnniversaryPlanSerializer,
        Trip: TripSerializer,
        TravelPlan: TravelPlanSerializer,
        Vet: VetSerializer,
        Walker: WalkerSerializer,
        Groomer: GroomerSerializer,
        Sitter: SitterSerializer,
        MicrochipCompany: MicrochipCompanySerializer,
        InsuranceCompany: InsuranceCompanySerializer,
        InsurancePolicy: InsurancePolicySerializer,
        Pet: PetSerializer,
        DaysOff: DaysOffSerializer,
        Employee: EmployeeSerializer,
        AcademicPlan: AcademicPlanSerializer,
        ExtracurricularPlan: ExtracurricularPlanSerializer,
        CareerGoal: CareerGoalSerializer,
        School: SchoolSerializer,
        Student: StudentSerializer,
        Home: HomeSerializer,
        SocialMedia: SocialMediaSerializer,
        SocialPlan: SocialPlanSerializer,
        HealthBeauty: HealthBeautySerializer,
        HealthGoal: HealthGoalSerializer,
        Finance: FinanceSerializer,
        Patient: PatientSerializer,
        Appointment: AppointmentSerializer,
        FoodPlan: FoodPlanSerializer,
        LaundryPlan: LaundryPlanSerializer,
        Garden: GardenSerializer,
    }

    class Meta:
        ref_name = "EntityPolymorphicSerializer"
