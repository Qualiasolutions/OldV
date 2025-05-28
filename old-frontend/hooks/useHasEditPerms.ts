import { useSelector } from 'react-redux';
import entitiesApi from 'reduxStore/services/api/entities';
import { selectTaskById } from 'reduxStore/slices/tasks/selectors';
import useGetUserFullDetails from './useGetUserDetails';

export default function useHasEditPerms(taskId: number) {
  const { data: userDetails } = useGetUserFullDetails();

  const { data: memberEntities } = useSelector(
    entitiesApi.endpoints.getMemberEntities.select()
  );
  const task = useSelector(selectTaskById(taskId));

  if (task?.type === 'ICAL_EVENT') {
    return false;
  }

  if (task?.type === 'USER_BIRTHDAY') {
    return false;
  }

  if (userDetails && task?.members.includes(userDetails.id)) {
    return true;
  }
  if (memberEntities) {
    if (task?.entities.some((entityId) => entityId in memberEntities.byId)) {
      return true;
    }
  }
  return false;
}
