import Calendar from 'components/calendars/TaskCalendar';
import TopNav from 'components/molecules/TopNav';
import { FullPageSpinner } from 'components/molecules/Spinners';
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { useGetAllScheduledTasksQuery } from 'reduxStore/services/api/tasks';
import useFilteredTasks from 'hooks/tasks/useFilteredTasks';
import useScheduledEntityIds from 'hooks/entities/useScheduledEntityIds';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: StatusBar.currentHeight,
    height: '100%'
  }
});

export default function CalendarScreen() {
  const filteredTasks = useFilteredTasks();
  const filteredEntities = useScheduledEntityIds();
  const { isLoading } = useGetAllScheduledTasksQuery();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <TopNav />
      <Calendar
        filteredTasks={filteredTasks}
        filteredEntities={filteredEntities}
        showFilters={true}
        showProFilters={true}
      />
    </SafeAreaView>
  );
}
