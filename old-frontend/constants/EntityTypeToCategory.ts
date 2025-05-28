import { CategoryName } from 'types/categories';
import { EntityTypeName, SchoolTermTypeName } from 'types/entities';

const ENTITY_TYPE_TO_CATEGORY: {
  [key in
    | EntityTypeName
    | SchoolTermTypeName
    | 'PetBirthday']: CategoryName | null;
} = {
  Anniversary: 'SOCIAL_INTERESTS',
  Birthday: 'SOCIAL_INTERESTS',
  Event: 'SOCIAL_INTERESTS',
  EventSubentity: 'SOCIAL_INTERESTS',
  Hobby: 'SOCIAL_INTERESTS',
  SocialMedia: 'SOCIAL_INTERESTS',
  SocialPlan: 'SOCIAL_INTERESTS',
  AnniversaryPlan: 'SOCIAL_INTERESTS',
  Clothing: 'LAUNDRY',
  LaundryPlan: 'LAUNDRY',
  Car: 'TRANSPORT',
  Boat: 'TRANSPORT',
  PublicTransport: 'TRANSPORT',
  Home: 'HOME',
  List: 'FAMILY',
  Food: 'FOOD',
  FoodPlan: 'FOOD',
  Holiday: 'TRAVEL',
  HolidayPlan: 'TRAVEL',
  Trip: 'TRAVEL',
  Flight: 'TRAVEL',
  TrainBusFerry: 'TRAVEL',
  RentalCar: 'TRAVEL',
  TaxiOrTransfer: 'TRAVEL',
  DriveTime: 'TRAVEL',
  HotelOrRental: 'TRAVEL',
  StayWithFriend: 'TRAVEL',
  TravelPlan: 'TRAVEL',
  Employee: 'CAREER',
  DaysOff: 'CAREER',
  CareerGoal: 'CAREER',
  AcademicPlan: 'EDUCATION',
  ExtracurricularPlan: 'EDUCATION',
  School: 'EDUCATION',
  Student: 'EDUCATION',
  SchoolBreak: 'EDUCATION',
  SchoolTerm: 'EDUCATION',
  SchoolTermStart: 'EDUCATION',
  SchoolTermEnd: 'EDUCATION',
  SchoolYearStart: 'EDUCATION',
  SchoolYearEnd: 'EDUCATION',
  Finance: 'FINANCE',
  Garden: 'GARDEN',
  HealthBeauty: 'HEALTH_BEAUTY',
  HealthGoal: 'HEALTH_BEAUTY',
  Patient: 'HEALTH_BEAUTY',
  Appointment: 'HEALTH_BEAUTY',
  ProfessionalEntity: null,
  Pet: 'PETS',
  PetBirthday: 'PETS'
};

export default ENTITY_TYPE_TO_CATEGORY;
