import { RESOURCE_TYPE_TO_TYPE } from 'constants/ResourceTypes';
import { useSelector } from 'react-redux';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import {
  useGetAllSchoolBreaksQuery,
  useGetAllSchoolTermsQuery,
  useGetAllSchoolYearsQuery
} from 'reduxStore/services/api/schoolTerms';
import { useGetAllScheduledTasksQuery } from 'reduxStore/services/api/tasks';
import {
  selectCompletionFilters,
  selectFilteredCategories,
  selectFilteredTaskTypes,
  selectFilteredUsers
} from 'reduxStore/slices/calendars/selectors';
import { selectEntityById } from 'reduxStore/slices/entities/selectors';
import { EntityTypeName, SchoolTermTypeName } from 'types/entities';

import { ScheduledEntityResponseType } from 'types/tasks';
import { formatEntitiesPerDate } from 'utils/formatTasksAndPeriods';
import filterEntity from './filterEntity';

const isEntity = (
  item: ScheduledEntityResponseType | undefined
): item is ScheduledEntityResponseType => {
  return !!item;
};

const emptyArray: number[] = [];

export default function useScheduledEntityIds(
  resourceTypes?: (EntityTypeName | SchoolTermTypeName)[],
  entityId?: number
) {
  const { data: allScheduledTasks } = useGetAllScheduledTasksQuery();
  const { data: allCategories } = useGetAllCategoriesQuery();
  const { data: schoolYears } = useGetAllSchoolYearsQuery();
  const { data: schoolTerms } = useGetAllSchoolTermsQuery();
  const { data: schoolBreaks } = useGetAllSchoolBreaksQuery();

  const filteredUsers = useSelector(selectFilteredUsers);
  const filteredCategories = useSelector(selectFilteredCategories);
  const filteredTaskTypes = useSelector(selectFilteredTaskTypes);
  const completionFilters = useSelector(selectCompletionFilters);
  const filteredEntity = useSelector(selectEntityById(entityId || -1));

  const { data: entitiesByCategory } = useGetAllEntitiesQuery(undefined, {
    selectFromResult: ({ data }) => {
      if (!data) {
        return { data: null };
      }
      return {
        data: data.byCategory
      };
    }
  });

  const { data: studentIds } = useGetAllEntitiesQuery(undefined, {
    selectFromResult: ({ data }) => {
      if (!data) {
        return { data: null };
      }
      return {
        data: data.byResourceType.Student || emptyArray
      };
    }
  });

  const { data: entitiesBySchool } = useGetAllEntitiesQuery(undefined, {
    selectFromResult: ({ data }) => {
      if (!data) {
        return { data: null };
      }
      return {
        data: data.bySchoolAttended
      };
    }
  });

  if (
    !allScheduledTasks?.orderedEntities ||
    !schoolYears ||
    !schoolBreaks ||
    !schoolTerms ||
    !entitiesByCategory ||
    !entitiesBySchool ||
    !studentIds ||
    !allCategories
  ) {
    return {};
  }

  const filteredEntities =
    allScheduledTasks.orderedEntities
      .map(({ id, recurrence_index, resourcetype }) => {
        const type = RESOURCE_TYPE_TO_TYPE[resourcetype] || 'ENTITY';
        return (
          allScheduledTasks?.byEntityId[type] &&
          allScheduledTasks?.byEntityId[type][id][
            recurrence_index === null ? -1 : recurrence_index
          ]
        );
      })
      .filter((entity) => {
        return filterEntity(
          entity,
          filteredEntity || undefined,
          resourceTypes,
          {
            allCategories,
            schoolYears,
            schoolBreaks,
            schoolTerms,
            entitiesByCategory,
            entitiesBySchool,
            studentIds
          },
          {
            filteredUsers: filteredUsers || [],
            filteredCategories: filteredCategories || [],
            filteredTaskTypes: filteredTaskTypes || [],
            completionFilters: completionFilters || []
          }
        );
      })
      .filter(isEntity) || [];

  const formatted = formatEntitiesPerDate(filteredEntities);

  return formatted;
}
