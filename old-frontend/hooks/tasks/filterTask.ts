import { AllCategories, AllEntities } from 'reduxStore/services/api/types';
import { ScheduledTaskResponseType, TaskType } from 'types/tasks';
import { TAG_TO_CATEGORY } from './constants';

export default function filterTask(
  task: ScheduledTaskResponseType,
  filteredUsers: number[],
  filteredCategories: number[],
  filteredTaskTypes: (TaskType | 'OTHER')[],
  completionFilters: ('COMPLETE' | 'INCOMPLETE')[],
  allCategories: AllCategories,
  allEntities: AllEntities
) {
  return (
    (!filteredUsers ||
      filteredUsers.length === 0 ||
      task.members.some((member) => filteredUsers?.includes(member))) &&
    (!filteredCategories ||
      filteredCategories.length === 0 ||
      filteredCategories.length === allCategories.ids.length ||
      task.entities.some((entityId) => {
        const entity = allEntities.byId[entityId];
        return entity && filteredCategories.includes(entity.category);
      }) ||
      task.tags.some((tagName) => {
        const tagCategoryName = TAG_TO_CATEGORY[tagName];
        const categoryId =
          tagCategoryName && allCategories.byName[tagCategoryName]?.id;
        return categoryId && filteredCategories.includes(categoryId);
      })) &&
    (!filteredTaskTypes ||
      filteredTaskTypes.length === 0 ||
      filteredTaskTypes.includes(task.type) ||
      (filteredTaskTypes.includes('OTHER') &&
        !['TASK', 'APPOINTMENT'].includes(task.type))) &&
    (!completionFilters ||
      completionFilters.length === 0 ||
      (completionFilters.includes('COMPLETE') &&
        completionFilters.includes('INCOMPLETE')) ||
      (completionFilters.includes('COMPLETE') && task.is_complete) ||
      (completionFilters.includes('INCOMPLETE') &&
        !task.is_complete &&
        (task.action_id || (task && ['TASK', 'DUE_DATE'].includes(task.type)))))
  );
}
