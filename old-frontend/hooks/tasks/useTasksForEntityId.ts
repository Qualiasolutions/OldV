import useEntityById from 'hooks/entities/useEntityById';
import { useGetAllScheduledTasksQuery } from 'reduxStore/services/api/tasks';
import { ScheduledTaskResponseType } from 'types/tasks';
import { formatTasksPerDate } from 'utils/formatTasksAndPeriods';

const isTask = (
  item: ScheduledTaskResponseType | undefined
): item is ScheduledTaskResponseType => {
  return !!item;
};

const useEntityParentId = (entityId: number) => {
  const entity = useEntityById(entityId);
  return entity?.parent;
};

export default function useTasksForEntityId(entityId: number) {
  const { data: scheduledTasks } = useGetAllScheduledTasksQuery(undefined, {
    selectFromResult: ({ data: taskData }) => ({
      data: taskData
    })
  });

  const entityParentId = useEntityParentId(entityId);

  if (!scheduledTasks) {
    return {};
  }

  const filteredTasks =
    scheduledTasks.ordered
      .map(({ id, recurrence_index, resourcetype, action_id }) => {
        const recurrenceIndex =
          recurrence_index === null ? -1 : recurrence_index;
        if (['FixedTask'].includes(resourcetype)) {
          return scheduledTasks?.byTaskId[id][recurrenceIndex];
        }

        if (action_id) {
          return scheduledTasks?.byActionId[action_id][recurrenceIndex];
        }
      })
      .filter(isTask)
      .filter((task) =>
        task.entities.some((ent) => {
          if (entityId === ent) {
            return true;
          }

          const parentEntityId = entityParentId;
          if (parentEntityId && entityId === parentEntityId) {
            return true;
          }

          return false;
        })
      ) || [];

  const formatted = formatTasksPerDate(filteredTasks);

  return formatted;
}
