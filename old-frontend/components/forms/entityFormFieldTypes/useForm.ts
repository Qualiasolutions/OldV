import { useTranslation } from 'react-i18next';
import { EntityTypeName } from 'types/entities';
import { FormFieldTypes } from '../formFieldTypes';
import { carForm } from './formFields/car';
import { professionalEntityForm } from './formFields/professional-entity';
import { boatForm } from './formFields/boat';
import { daysOffForm } from './formFields/days-off';
import { eventForm } from './formFields/event';
import { financeForm } from './formFields/finance';
import { healthBeautyForm } from './formFields/health-beauty';
import { hobbyForm } from './formFields/hobby';
import { holidayForm } from './formFields/holiday';
import { homeForm } from './formFields/home';
import { listForm } from './formFields/list';
import { petForm } from './formFields/pet';
import { publicTransportForm } from './formFields/public-transport';
import { schoolForm } from './formFields/school';
import { socialMediaForm } from './formFields/social-media';
import { socialPlanForm } from './formFields/social-plan';
import { tripForm } from './formFields/trip';
import { useMemo } from 'react';
import { studentForm } from './formFields/student';
import { travelPlanForm } from './formFields/travel-plan';
import { anniversaryPlanForm } from './formFields/anniversary-plan';
import { holidayPlanForm } from './formFields/holiday-plan';
import { healthGoal } from './formFields/health-goal';
import { useSelector } from 'react-redux';
import { selectEntitiesByEntityTypes } from 'reduxStore/slices/entities/selectors';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import { defaultForm } from './formFields/default';
import { useGetAllProfessionalCategoriesQuery } from 'reduxStore/services/api/categories';

const schoolSelector = selectEntitiesByEntityTypes(['School']);

export default function useForm(
  entityType: EntityTypeName,
  isEdit: boolean
): FormFieldTypes {
  const { t } = useTranslation('modelFields');

  const allSchoolIds = useSelector(schoolSelector);
  const { data: allEntities } = useGetAllEntitiesQuery(undefined);
  const { data: allProfessionalCategories } =
    useGetAllProfessionalCategoriesQuery();

  const form = useMemo(() => {
    if (entityType === 'ProfessionalEntity') {
      if (!allProfessionalCategories) {
        return {};
      }
      return professionalEntityForm(isEdit, allProfessionalCategories, t);
    }
    if (entityType === 'Car') {
      return carForm(isEdit, t);
    }

    if (entityType === 'Boat') {
      return boatForm(isEdit, t);
    }

    if (entityType === 'AcademicPlan') {
      return defaultForm(isEdit, t);
    }

    if (entityType === 'CareerGoal') {
      return defaultForm(isEdit, t);
    }

    if (entityType === 'LaundryPlan') {
      return defaultForm(isEdit, t);
    }

    if (entityType === 'DaysOff') {
      return daysOffForm(isEdit, t);
    }

    if (entityType === 'Event') {
      return eventForm(isEdit, t);
    }

    if (entityType === 'EventSubentity') {
      return defaultForm(isEdit, t);
    }

    if (entityType === 'ExtracurricularPlan') {
      return defaultForm(isEdit, t);
    }

    if (entityType === 'Finance') {
      return financeForm(isEdit, t);
    }

    if (entityType === 'FoodPlan') {
      return defaultForm(isEdit, t);
    }

    if (entityType === 'HealthBeauty') {
      return healthBeautyForm(isEdit, t);
    }

    if (entityType === 'Hobby') {
      return hobbyForm(isEdit, t);
    }

    if (entityType === 'Holiday') {
      return holidayForm(isEdit, t);
    }

    if (entityType === 'Home') {
      return homeForm(isEdit, t);
    }

    if (entityType === 'Garden') {
      return defaultForm(isEdit, t);
    }

    if (entityType === 'List') {
      return listForm(isEdit, t);
    }

    if (entityType === 'Pet') {
      return petForm(isEdit, t);
    }

    if (entityType === 'PublicTransport') {
      return publicTransportForm(isEdit, t);
    }

    if (entityType === 'School') {
      return schoolForm(isEdit, t);
    }

    if (entityType === 'SocialMedia') {
      return socialMediaForm(isEdit, t);
    }

    if (entityType === 'SocialPlan') {
      return socialPlanForm(isEdit, t);
    }

    if (entityType === 'Trip') {
      return tripForm(isEdit, t);
    }

    if (entityType === 'Patient') {
      return defaultForm(isEdit, t);
    }

    if (entityType === 'Appointment') {
      return defaultForm(isEdit, t);
    }

    if (entityType === 'Student') {
      if (!allEntities) {
        return {};
      }
      const allSchools = allSchoolIds.map((id) => allEntities.byId[id]);

      return studentForm(isEdit, allSchools, t);
    }

    if (entityType === 'Employee') {
      return defaultForm(isEdit, t);
    }

    if (entityType === 'TravelPlan') {
      return travelPlanForm(isEdit, t);
    }

    if (entityType === 'AnniversaryPlan') {
      return anniversaryPlanForm(isEdit, t);
    }

    if (entityType === 'HolidayPlan') {
      return holidayPlanForm(isEdit, t);
    }

    if (entityType === 'HealthGoal') {
      return healthGoal(isEdit, t);
    }

    return {};
  }, [
    entityType,
    isEdit,
    t,
    allEntities,
    allSchoolIds,
    allProfessionalCategories
  ]);

  return form;
}
