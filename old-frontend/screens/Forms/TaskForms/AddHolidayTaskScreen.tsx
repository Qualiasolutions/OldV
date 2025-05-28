import AddHolidayTaskForm from 'components/forms/AddHolidayTaskForm';
import { FullPageSpinner } from 'components/molecules/Spinners';
import useGetUserFullDetails from 'hooks/useGetUserDetails';

export default function AddHolidayTaskScreen() {
  const { data: userDetails } = useGetUserFullDetails();

  if (!userDetails) {
    return <FullPageSpinner />;
  }

  return (
    <AddHolidayTaskForm
      onSuccess={() => {}}
      defaults={{
        actions: [{ action_timedelta: '56 days' }],
        members: userDetails.family.users.map((user) => user.id)
      }}
    />
  );
}
