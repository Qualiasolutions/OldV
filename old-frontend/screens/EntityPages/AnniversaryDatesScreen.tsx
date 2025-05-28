import useEntityTypeHeader from 'headers/hooks/useEntityTypeHeader';
import {
  useGetAllScheduledTasksQuery,
  useGetAllTasksQuery
} from 'reduxStore/services/api/tasks';
import { FullPageSpinner } from 'components/molecules/Spinners';
import {
  AlmostBlackText,
  LightBlackText
} from 'components/molecules/TextComponents';
import { WhiteBox } from 'components/molecules/ViewComponents';
import { StyleSheet } from 'react-native';
import {
  getDateWithoutTimezone,
  getUTCValuesFromDateString
} from 'utils/datesAndTimes';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from 'components/Themed';
import {
  AnniversaryTaskResponseType,
  ScheduledTaskResponseType
} from 'types/tasks';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import DatedTaskListPage from 'components/lists/DatedTaskListPage';
import { useSelector } from 'react-redux';
import { selectTaskById } from 'reduxStore/slices/tasks/selectors';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';

function AnniversaryCard({ task }: { task: ScheduledTaskResponseType }) {
  const baseTask = useSelector(
    selectTaskById(task.id)
  ) as AnniversaryTaskResponseType;
  const navigation = useNavigation();

  const styles = StyleSheet.create({
    card: {
      marginTop: 10,
      alignItems: 'center',
      borderColor: useThemeColor({}, 'almostBlack')
    },
    listEntryText: {
      fontSize: 20
    },
    cardSubtitle: { fontSize: 18 }
  });

  if (!baseTask?.start_date || !task?.start_date) {
    return null;
  }

  const { monthName, day } = getUTCValuesFromDateString(baseTask.start_date);

  const startDate = getDateWithoutTimezone(baseTask.start_date);
  const instanceDate = getDateWithoutTimezone(task.start_date);
  const yearsOffset = instanceDate.getFullYear() - startDate.getFullYear();

  return (
    <WhiteBox style={styles.card}>
      <TouchableOpacity
        onPress={() => {
          (navigation as any).navigate('EditTask', { taskId: baseTask.id });
        }}
      >
        <LightBlackText
          text={baseTask.title || ''}
          style={styles.listEntryText}
        />
        <AlmostBlackText
          style={styles.cardSubtitle}
          text={`${
            baseTask.type === 'USER_BIRTHDAY' || baseTask?.known_year
              ? `${yearsOffset} on `
              : ''
          }${monthName} ${day}`}
        />
      </TouchableOpacity>
    </WhiteBox>
  );
}

export default function AnniversaryDatesScreen() {
  useEntityTypeHeader('anniversary-dates');

  const { data: allTasks, isLoading: isLoadingTasks } = useGetAllTasksQuery();
  const { data: allScheduledTasks, isLoading: isLoadingScheduledTasks } =
    useGetAllScheduledTasksQuery();

  if (isLoadingTasks || isLoadingScheduledTasks || !allTasks) {
    return <FullPageSpinner />;
  }

  const birthdayTasks = allTasks.ids
    .map((id) => allTasks.byId[id])
    .filter((task) =>
      ['BIRTHDAY', 'ANNIVERSARY', 'USER_BIRTHDAY'].includes(task.type)
    );

  const birthdayIds = birthdayTasks.map((task) => task.id);

  let birthdayScheduledTasks: ScheduledTaskResponseType[] = [];
  for (const taskId of birthdayIds) {
    birthdayScheduledTasks = [
      ...birthdayScheduledTasks,
      ...Object.values(allScheduledTasks?.byTaskId[taskId] || {})
    ];
  }

  return (
    <TransparentFullPageScrollView>
      <DatedTaskListPage
        tasks={birthdayScheduledTasks}
        card={AnniversaryCard}
      />
    </TransparentFullPageScrollView>
  );
}
