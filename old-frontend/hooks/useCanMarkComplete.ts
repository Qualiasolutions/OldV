import { useSelector } from 'react-redux';
import {
  selectScheduledTask,
  selectTaskById
} from 'reduxStore/slices/tasks/selectors';
import useGetUserFullDetails from './useGetUserDetails';
import useHasEditPerms from './useHasEditPerms';

export default function useCanMarkComplete({
  taskId,
  recurrenceIndex,
  actionId
}: {
  taskId: number;
  recurrenceIndex?: number | null;
  actionId?: number | null;
}) {
  const { data: userDetails } = useGetUserFullDetails();
  const task = useSelector(selectTaskById(taskId));
  const taskToAction = useSelector(
    selectScheduledTask({
      id: taskId,
      recurrenceIndex,
      actionId
    })
  );

  const hasEditPerms = useHasEditPerms(taskId);

  const canMarkComplete =
    userDetails?.is_premium &&
    (hasEditPerms || task && (["USER_BIRTHDAY", "ICAL_EVENT"].includes(task.type))) &&
    taskToAction &&
    (actionId || (task && (task.type as any !== "ENTITY")));

  return canMarkComplete;
}
