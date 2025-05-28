import { useSelector } from 'react-redux';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import { useGetAllScheduledTasksQuery } from 'reduxStore/services/api/tasks';
import { selectCategoryById } from 'reduxStore/slices/categories/selectors';
import { CategoryName } from 'types/categories';
import { ScheduledTaskResponseType } from 'types/tasks';
import { formatTasksPerDate } from 'utils/formatTasksAndPeriods';
import { TAG_TO_CATEGORY } from './constants';

const EXTRA_CATEGORY_ITEMS: {
  [key in CategoryName]?: {
    tags?: string[];
    types?: string[];
  };
} = {
  SOCIAL_INTERESTS: {
    tags: [
      'SOCIAL_INTERESTS__BIRTHDAY',
      'SOCIAL_INTERESTS__ANNIVERSARY',
      'SOCIAL_INTERESTS__HOLIDAY'
    ],
    types: ['BIRTHDAY', 'ANNIVERSARY', 'HOLIDAY']
  }
};

const isTask = (
  item: ScheduledTaskResponseType | undefined
): item is ScheduledTaskResponseType => {
  return !!item;
};

export default function useTasksForCategory(categoryId: number) {
  const category = useSelector(selectCategoryById(categoryId));
  const { data: entitiesData } = useGetAllEntitiesQuery();
  const { data } = useGetAllScheduledTasksQuery(undefined, {
    selectFromResult: ({ data: taskData }) => ({
      data: taskData
    })
  });

  if (!data) {
    return {};
  }

  if (!entitiesData) {
    return {};
  }

  const taskData = data;
  if (!taskData || !entitiesData || !category) {
    return {};
  }

  const extraItems = EXTRA_CATEGORY_ITEMS[category.name];

  const filteredTasks =
    taskData.ordered
      .map(({ id, recurrence_index, resourcetype, action_id }) => {
        const recurrenceIndex =
          recurrence_index === null ? -1 : recurrence_index;
        if (['FixedTask'].includes(resourcetype)) {
          return taskData.byTaskId[id][recurrenceIndex];
        }

        if (action_id) {
          return taskData?.byActionId[action_id][recurrenceIndex];
        }
      })
      .filter(isTask)
      .filter(
        (task) =>
          task.entities.some(
            (ent) =>
              entitiesData.byId[ent] &&
              entitiesData.byId[ent].category === category.id
          ) ||
          task.tags.some((tagName) => {
            return TAG_TO_CATEGORY[tagName] === category.name;
          }) ||
          (extraItems &&
            ((extraItems.tags &&
              task.tags.some((tag) => extraItems?.tags?.includes(tag))) ||
              (extraItems.types && extraItems.types.includes(task.type))))
      ) || [];

  const formatted = formatTasksPerDate(filteredTasks);

  return formatted;
}
