import { useSelector } from 'react-redux';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import { useGetAllScheduledTasksQuery } from 'reduxStore/services/api/tasks';
import {
  selectCompletionFilters,
  selectFilteredCategories,
  selectFilteredTaskTypes,
  selectFilteredUsers
} from 'reduxStore/slices/calendars/selectors';
import { ScheduledTaskResponseType } from 'types/tasks';
import { formatTasksPerDate } from 'utils/formatTasksAndPeriods';
import filterTask from './filterTask';

const isTask = (
  item?: ScheduledTaskResponseType
): item is ScheduledTaskResponseType => {
  return !!item;
};

export default function useFilteredTasks() {
  const { data: scheduledTasks } = useGetAllScheduledTasksQuery(undefined, {
    selectFromResult: ({ data: taskData }) => ({
      data: taskData
    })
  });

  const { data: entitiesData } = useGetAllEntitiesQuery();
  const { data: categoriesData } = useGetAllCategoriesQuery();

  const users = useSelector(selectFilteredUsers);
  const categories = useSelector(selectFilteredCategories);
  const taskTypes = useSelector(selectFilteredTaskTypes);
  const completionFilters = useSelector(selectCompletionFilters);

  if (
    !entitiesData ||
    !categoriesData ||
    !scheduledTasks ||
    !users ||
    !categories ||
    !taskTypes ||
    !completionFilters
  ) {
    return {};
  }

  const filteredTasks = (
    scheduledTasks.ordered
      .map(({ id, recurrence_index, resourcetype, action_id }) => {
        const recurrenceIndex =
          recurrence_index === null ? -1 : recurrence_index;
        if (['FixedTask'].includes(resourcetype)) {
          return (
            scheduledTasks.byTaskId[id] &&
            scheduledTasks.byTaskId[id][recurrenceIndex]
          );
        }

        if (action_id) {
          return (
            scheduledTasks.byActionId[action_id] &&
            scheduledTasks.byActionId[action_id][recurrenceIndex]
          );
        }
      })
      .filter(
        (task) =>
          task &&
          filterTask(
            task,
            users,
            categories,
            taskTypes,
            completionFilters,
            categoriesData,
            entitiesData
          )
      ) || []
  ).filter(isTask);

  const formatted = formatTasksPerDate(filteredTasks);

  return formatted;
}
