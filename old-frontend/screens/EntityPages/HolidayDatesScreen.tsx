import useEntityTypeHeader from 'headers/hooks/useEntityTypeHeader';
import {
  useDeleteTaskMutation,
  useGetAllScheduledTasksQuery,
  useGetAllTasksQuery
} from 'reduxStore/services/api/tasks';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import {
  AlmostBlackText,
  LightBlackText
} from 'components/molecules/TextComponents';
import { TransparentView, WhiteBox } from 'components/molecules/ViewComponents';
import { StyleSheet } from 'react-native';
import { getDateWithoutTimezone } from 'utils/datesAndTimes';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from 'components/Themed';
import SafePressable from 'components/molecules/SafePressable';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';

import { getLongDateFromDateObject } from 'utils/datesAndTimes';
import { isHolidayTask, ScheduledTaskResponseType } from 'types/tasks';
import DatedTaskListPage from 'components/lists/DatedTaskListPage';
import { Swipeable, TouchableOpacity } from 'react-native-gesture-handler';
import { Image } from 'components/molecules/ImageComponents';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useTranslation } from 'react-i18next';

const trashImage = require('assets/images/icons/trash.png');

const useStyles = () => {
  const primaryColor = useThemeColor({}, 'primary');
  return StyleSheet.create({
    container: { paddingBottom: 100 },
    card: {
      alignItems: 'center'
    },
    swipeable: {
      marginTop: 10,
      overflow: 'visible'
    },
    listEntryText: {
      fontSize: 16
    },
    datesText: {
      fontSize: 14
    },
    deleteButton: {
      width: 50,
      marginLeft: 10,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flex: 1
    },
    deleteButtonInner: {
      backgroundColor: primaryColor,
      flex: 0,
      justifyContent: 'center',
      alignItems: 'center',
      width: 35,
      height: 60,
      borderRadius: 10
    },
    deleteButtonImage: { margin: 'auto' }
  });
};

function HolidayCard({ task }: { task: ScheduledTaskResponseType }) {
  const navigation = useNavigation();
  const borderColor = useThemeColor({}, 'almostBlack');
  const styles = useStyles();
  const { t } = useTranslation();
  const [deleteTask, deleteTaskResult] = useDeleteTaskMutation();

  if (!(task?.start_date && task?.end_date)) {
    return null;
  }

  const startDateString = getLongDateFromDateObject(
    getDateWithoutTimezone(task?.start_date)
  );
  const endDateString = getLongDateFromDateObject(
    getDateWithoutTimezone(task?.end_date)
  );

  const renderRightActions = () => {
    if (deleteTaskResult.isLoading) {
      return <PaddedSpinner />;
    }
    return (
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={async () => {
          try {
            await deleteTask({ id: task.id }).unwrap();
          } catch {
            Toast.show({
              type: 'error',
              text1: t('common.errors.generic')
            });
          }
        }}
      >
        <TransparentView style={styles.deleteButtonInner}>
          <Image source={trashImage} style={styles.deleteButtonImage} />
        </TransparentView>
      </TouchableOpacity>
    );
  };

  return (
    <Swipeable
      useNativeAnimations={true}
      overshootRight={false}
      renderRightActions={renderRightActions}
      containerStyle={styles.swipeable}
    >
      <SafePressable
        onPress={() => {
          (navigation as any).navigate('EditTask', { taskId: task.id });
        }}
      >
        <WhiteBox style={[styles.card, { borderColor }]}>
          <LightBlackText
            text={task.title || ''}
            style={styles.listEntryText}
          />
          <AlmostBlackText
            style={styles.datesText}
            text={`${startDateString}${
              task.end_date !== task.start_date ? ` to ${endDateString}` : ''
            }`}
          />
        </WhiteBox>
      </SafePressable>
    </Swipeable>
  );
}

export default function HolidayDatesScreen() {
  const styles = useStyles();
  useEntityTypeHeader('holiday-dates');

  const { data: allTasks, isLoading: isLoadingTasks } = useGetAllTasksQuery();
  const { data: allScheduledTasks, isLoading: isLoadingScheduledTasks } =
    useGetAllScheduledTasksQuery();

  const holidayTasks = allTasks?.ids
    .map((id) => allTasks.byId[id])
    .filter(isHolidayTask)
    .map(({ id }: { id: number }) =>
      Object.values(allScheduledTasks?.byTaskId[id] || {})
    )
    .flat()
    .sort((a, b) =>
      a.start_date && b.start_date && a.start_date < b.start_date ? -1 : 1
    );

  const isLoading = isLoadingTasks || isLoadingScheduledTasks;
  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!holidayTasks) {
    return null;
  }

  return (
    <TransparentFullPageScrollView contentContainerStyle={styles.container}>
      <DatedTaskListPage tasks={holidayTasks} card={HolidayCard} />
    </TransparentFullPageScrollView>
  );
}
