import { AllCategories } from 'reduxStore/services/api/types';

import {
  EntityResponseType,
  EntityTypeName,
  isStudentEntity,
  SchoolTermTypeName
} from 'types/entities';
import {
  AllSchoolBreaks,
  AllSchoolTerms,
  AllSchoolYears
} from 'types/schoolTerms';
import { ScheduledEntityResponseType, TaskType } from 'types/tasks';

const SCHOOL_ENTITY_TYPES = [
  'SchoolYearStart',
  'SchoolYearEnd',
  'SchoolTerm',
  'SchoolTermStart',
  'SchoolTermEnd',
  'SchoolBreak'
];

export default function filterEntity(
  { id, resourcetype, members }: ScheduledEntityResponseType,
  filteredEntity: EntityResponseType | undefined,
  resourceTypes:
    | (EntityTypeName | SchoolTermTypeName | 'PetBirthday')[]
    | undefined,
  {
    allCategories,
    schoolYears,
    schoolBreaks,
    schoolTerms,
    entitiesByCategory,
    entitiesBySchool,
    studentIds
  }: {
    allCategories: AllCategories;
    schoolYears: AllSchoolYears;
    schoolBreaks: AllSchoolBreaks;
    schoolTerms: AllSchoolTerms;
    entitiesByCategory: { [key: number]: number[] };
    entitiesBySchool: { [key: number]: number[] };
    studentIds: number[];
  },
  {
    filteredUsers,
    filteredCategories,
    filteredTaskTypes,
    completionFilters
  }: {
    filteredUsers: number[];
    filteredCategories: number[];
    filteredTaskTypes: (TaskType | 'OTHER')[];
    completionFilters: ('COMPLETE' | 'INCOMPLETE')[];
  }
) {
  if (
    !(
      (!filteredUsers ||
        filteredUsers.length === 0 ||
        members.some((member) => filteredUsers?.includes(member))) &&
      (!filteredCategories ||
        filteredCategories.length === 0 ||
        filteredCategories.length === allCategories.ids.length ||
        filteredCategories.some((categoryId) =>
          entitiesByCategory[categoryId]?.includes(id)
        ) ||
        (filteredCategories.some(
          (categoryId) => allCategories.byId[categoryId].name === 'EDUCATION'
        ) &&
          SCHOOL_ENTITY_TYPES.includes(resourcetype))) &&
      (!filteredTaskTypes ||
        filteredTaskTypes.length === 0 ||
        filteredTaskTypes.includes('OTHER')) &&
      (!completionFilters ||
        completionFilters.length === 0 ||
        (completionFilters.includes('COMPLETE') &&
          completionFilters.includes('INCOMPLETE')))
    )
  ) {
    return false;
  }

  if (resourceTypes && !resourceTypes.includes(resourcetype)) {
    return false;
  }

  if (
    id === filteredEntity?.id &&
    !SCHOOL_ENTITY_TYPES.includes(resourcetype)
  ) {
    // Have exact entity ID match
    return true;
  }

  if (resourceTypes && resourceTypes.includes(resourcetype)) {
    // Have exact resource type match
    return true;
  }

  if (!filteredEntity && !resourceTypes) {
    // No filtering
    return true;
  }

  if (resourceTypes) {
    // Otherwise if resourceTypes is specified then only return exact resource type matches
    return false;
  }

  if (
    !(
      filteredEntity?.resourcetype &&
      ['School', 'Student'].includes(filteredEntity?.resourcetype)
    )
  ) {
    return false;
  }

  // At this point entityId must be specified
  if (filteredEntity?.id) {
    let schoolYear = null;
    if (['SchoolYearStart', 'SchoolYearEnd'].includes(resourcetype)) {
      schoolYear = schoolYears.byId[id];
    }
    if (
      ['SchoolTermStart', 'SchoolTermEnd', 'SchoolTerm'].includes(resourcetype)
    ) {
      const schoolTerm = schoolTerms.byId[id];
      const schoolYearId = schoolTerm.school_year;
      schoolYear = schoolYears.byId[schoolYearId];
    }
    if (['SchoolBreak'].includes(resourcetype)) {
      const schoolBreak = schoolBreaks.byId[id];
      const schoolYearId = schoolBreak.school_year;
      schoolYear = schoolYears.byId[schoolYearId];
    }

    if (schoolYear) {
      if (
        filteredEntity.resourcetype === 'School' &&
        filteredEntity.id === schoolYear.school
      ) {
        return true;
      }

      if (
        isStudentEntity(filteredEntity) &&
        filteredEntity.school_attended === schoolYear.school
      ) {
        return true;
      }
    }
  }

  return false;
}
