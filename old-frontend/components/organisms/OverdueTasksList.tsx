import Calendar from 'components/calendars/TaskCalendar';
import { useSelector } from 'react-redux';
import { selectFilteredOverdueTasks } from 'reduxStore/slices/tasks/selectors';
import { formatTasksPerDate } from 'utils/formatTasksAndPeriods';
import { useThemeColor } from 'components/Themed';

export default function OverdueTasksList() {
  const overdueTasks = useSelector(selectFilteredOverdueTasks);
  const formattedOverdueTasks = formatTasksPerDate(overdueTasks);
  const errorBackground = useThemeColor({}, 'errorBackground');
  const whiteColor = useThemeColor({}, 'white');

  return (
    <Calendar
      showFilters={true}
      reverse={true}
      headerStyle={{ backgroundColor: errorBackground }}
      headerTextStyle={{ color: whiteColor }}
      filteredTasks={formattedOverdueTasks}
      filteredEntities={{}}
    />
  );
}
