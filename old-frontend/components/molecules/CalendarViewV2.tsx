import { Text, useThemeColor } from 'components/Themed';
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { WhiteFullPageScrollView } from './ScrollViewComponents';
import { useSelector } from 'react-redux';
import { selectEnforcedDate } from 'reduxStore/slices/calendars/selectors';
import { selectScheduledTask } from 'reduxStore/slices/tasks/selectors';
import { ScheduledEntity } from 'components/calendars/TaskCalendar/components/Task';
import { TransparentView } from './ViewComponents';
import { ScrollView } from 'react-native-gesture-handler';
import SafePressable from './SafePressable';
import { MinimalScheduledTask } from 'types/tasks';
import useEntityById from 'hooks/entities/useEntityById';

export type CalendarViewProps = {
  tasks: { [date: string]: MinimalScheduledTask[] };
  entities?: { [date: string]: ScheduledEntity[] };
  onChangeDate?: (date: string) => void;
  hidden?: boolean;
};

function useStyle() {
  return StyleSheet.create({
    container: { height: '100%', marginBottom: 0 },
    dayComponent: {
      width: 58,
      height: 70,
      borderWidth: 0.2,
      borderColor: useThemeColor({}, 'almostBlack'),
      margin: 0,
      paddingVertical: 1,
      paddingHorizontal: 2
    },
    dayComponentInnerContainer: {
      height: '100%'
    },
    date: { fontSize: 10, textAlign: 'left' },
    taskText: { fontSize: 8, marginBottom: 1 }
  });
}

const ListedTask = ({
  id,
  recurrenceIndex,
  actionId
}: {
  id: number;
  recurrenceIndex: number | null;
  actionId?: number | null;
}) => {
  const task = useSelector(
    selectScheduledTask({ id, recurrenceIndex, actionId })
  );
  const styles = useStyle();
  if (!task) {
    return null;
  }
  return <Text style={styles.taskText}>{task.title}</Text>;
};

const ListedEntity = ({ id }: { id: number }) => {
  const entity = useEntityById(id);
  const styles = useStyle();
  if (!entity) {
    return null;
  }
  return <Text style={styles.taskText}>{entity.name}</Text>;
};

const CalendarContent = ({
  onChangeDate,
  tasks,
  entities
}: CalendarViewProps) => {
  const [forcedInitialDate, setForcedInitialDate] = useState<string | null>(
    null
  );
  const styles = useStyle();
  const enforcedDate = useSelector(selectEnforcedDate);
  const whiteColor = useThemeColor({}, 'white');
  const almostWhiteColor = useThemeColor({}, 'almostWhite');
  const currentDayColor = useThemeColor({}, 'lightYellow');

  const updateDate = (newDate: string) => {
    setForcedInitialDate(newDate);
    if (onChangeDate) {
      // Put this in a timeout so that we don't have
      // to wait for updates
      setTimeout(() => {
        onChangeDate(newDate);
      }, 1);
    }
  };

  useEffect(() => {
    setForcedInitialDate(null);
  }, [enforcedDate]);

  const currentDate = forcedInitialDate || enforcedDate || undefined;

  return (
    <WhiteFullPageScrollView style={styles.container}>
      <Calendar
        minDate={'2012-05-10'}
        pagingEnabled={true}
        horizontal={true}
        style={{ height: 830 }}
        onPressArrowLeft={(cb, date) => {
          cb();
          if (date) {
            updateDate(date.addMonths(-1).toString('yyyy-MM-dd'));
          }
        }}
        onPressArrowRight={(cb, date) => {
          cb();
          if (date) {
            updateDate(date.addMonths(1).toString('yyyy-MM-dd'));
          }
        }}
        initialDate={currentDate}
        dayComponent={({ date }) => {
          if (date) {
            return (
              <SafePressable
                onPress={() => {
                  updateDate(date.dateString);
                  setForcedInitialDate(date.dateString);
                }}
                style={[
                  styles.dayComponent,
                  {
                    backgroundColor:
                      currentDate &&
                      parseInt(currentDate.split('-')[1]) === date.month
                        ? parseInt(currentDate.split('-')[2]) === date.day
                          ? currentDayColor
                          : whiteColor
                        : almostWhiteColor
                  }
                ]}
              >
                <ScrollView>
                  <TransparentView style={styles.dayComponentInnerContainer}>
                    <Text style={[styles.date]}>{date.day}</Text>
                    {entities &&
                      entities[date.dateString] &&
                      entities[date.dateString].map((entity) => (
                        <ListedEntity
                          id={entity.id}
                          key={`${entity.id}_${entity.resourcetype}`}
                        />
                      ))}
                    {tasks &&
                      tasks[date.dateString] &&
                      tasks[date.dateString].map((task) => (
                        <ListedTask
                          id={task.id}
                          recurrenceIndex={task.recurrence_index}
                          key={`${task.id}_${task.recurrence_index}`}
                          actionId={task.action_id}
                        />
                      ))}
                  </TransparentView>
                </ScrollView>
              </SafePressable>
            );
          }
          return null;
        }}
      />
    </WhiteFullPageScrollView>
  );
};

export default function CalendarView({
  onChangeDate,
  tasks,
  entities,
  hidden
}: CalendarViewProps) {
  if (hidden) {
    return null;
  }
  return (
    <CalendarContent
      onChangeDate={onChangeDate}
      tasks={tasks}
      entities={entities}
    />
  );
}
