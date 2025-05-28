import { useFieldTypesForTask } from 'components/forms/taskFormFieldTypes';
import useGetUserDetails from 'hooks/useGetUserDetails';
import { useMemo } from 'react';
import { getTimeInTimezone } from 'utils/datesAndTimes';
import { useSelector } from 'react-redux';
import {
  selectScheduledTask,
  selectTaskById
} from 'reduxStore/slices/tasks/selectors';
import createInitialObject from 'components/forms/utils/createInitialObject';

export default function useDefaultTaskValues(
  taskId: number,
  recurrenceIndex?: number
) {
  const taskObj = useSelector(selectTaskById(taskId));
  const scheduledTaskObj = useSelector(
    selectScheduledTask({
      id: taskId,
      recurrenceIndex
    })
  );
  const { data: userDetails } = useGetUserDetails();
  const taskFields = useFieldTypesForTask(taskObj);

  const defaultValues = useMemo(() => {
    if (taskObj && userDetails) {
      const baseTask = { ...(scheduledTaskObj || taskObj) };

      if (baseTask.start_date) {
        baseTask.date = baseTask.start_date;
      }

      if (taskObj.start_timezone && baseTask.start_datetime) {
        const newStart = getTimeInTimezone(
          baseTask.start_datetime,
          taskObj.start_timezone
        );
        baseTask.start_datetime = newStart;
      }
      if (taskObj.end_timezone && baseTask.end_datetime) {
        const newEnd = getTimeInTimezone(
          baseTask.end_datetime,
          taskObj.end_timezone
        );
        baseTask.end_datetime = newEnd;
      }

      const newTaskToEdit = {
        ...taskObj,
        date: baseTask.date as string,
        start_datetime: baseTask.start_datetime
          ? new Date(baseTask.start_datetime)
          : undefined,
        end_datetime: baseTask.end_datetime
          ? new Date(baseTask.end_datetime)
          : undefined,
        is_any_time: !!baseTask.date,
        tagsAndEntities: {
          entities: taskObj.entities,
          tags: taskObj.tags || []
        }
      };

      const initialTaskFields = createInitialObject(
        taskFields,
        userDetails,
        newTaskToEdit
      );
      return initialTaskFields;
    }
  }, [taskObj, scheduledTaskObj, userDetails, taskFields]);

  return defaultValues;
}
