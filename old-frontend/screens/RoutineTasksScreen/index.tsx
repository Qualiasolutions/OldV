import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import Task from 'components/calendars/TaskCalendar/components/Task';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { PrimaryText } from 'components/molecules/TextComponents';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';
import { TransparentPaddedView } from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { selectRoutineById } from 'reduxStore/slices/routines/selectors';
import { selectTasksForRoutineForDate } from 'reduxStore/slices/tasks/selectors';
import { RootTabParamList, RootTabScreenProps } from 'types/base';
import {
  getDateStringFromDateObject,
  getHumanReadableDate
} from 'utils/datesAndTimes';

const styles = StyleSheet.create({
  title: { fontWeight: 'bold', fontSize: 20, marginBottom: 10 },
  navigatorButtons: { flexDirection: 'row', justifyContent: 'center' },
  navigatorButton: { marginHorizontal: 20 },
  navigatorButtonText: { fontSize: 18 }
});

type RoutineTasksScreenProps = RootTabScreenProps<'RoutineTasks'>;
export default function RoutineTasksScreen({ route }: RoutineTasksScreenProps) {
  const { id, date } = route.params;
  const { t } = useTranslation();
  const routine = useSelector(selectRoutineById(id));
  const routineTasks = useSelector(selectTasksForRoutineForDate(id, date));
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();

  if (!routine) {
    return null;
  }

  const routineTaskViews = routineTasks ? (
    routineTasks.map((task) => <Task task={task} date={date} key={task.id} />)
  ) : (
    <Text>{t('screens.routineTasks.noTasks')}</Text>
  );

  return (
    <TransparentFullPageScrollView>
      <TransparentPaddedView style={styles.navigatorButtons}>
        <TouchableOpacity
          onPress={() => {
            const prevDate = new Date(date);
            prevDate.setDate(prevDate.getDate() - 1);
            navigation.navigate('RoutineTasks', {
              id,
              date: getDateStringFromDateObject(prevDate)
            });
          }}
          style={styles.navigatorButton}
        >
          <PrimaryText
            text={t('common.previous')}
            style={styles.navigatorButtonText}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);
            navigation.navigate('RoutineTasks', {
              id,
              date: getDateStringFromDateObject(nextDate)
            });
          }}
          style={styles.navigatorButton}
        >
          <PrimaryText
            text={t('common.next')}
            style={styles.navigatorButtonText}
          />
        </TouchableOpacity>
      </TransparentPaddedView>
      <TransparentPaddedView>
        <Text style={styles.title}>
          {routine.name} {getHumanReadableDate(date)}
        </Text>
        {routineTaskViews}
      </TransparentPaddedView>
    </TransparentFullPageScrollView>
  );
}
