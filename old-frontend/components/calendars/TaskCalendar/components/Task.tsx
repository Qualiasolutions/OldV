import { Pressable, StyleSheet, Touchable } from 'react-native';
import { Text, useThemeColor } from 'components/Themed';
import {
  getTimeInTimezone,
  getTimeStringFromDateObject
} from 'utils/datesAndTimes';
import React, { useRef } from 'react';

import { BlackText } from 'components/molecules/TextComponents';
import { TransparentView } from 'components/molecules/ViewComponents';
import { useTranslation } from 'react-i18next';
import { ITEM_HEIGHT } from './shared';
import EntityTags from 'components/molecules/EntityTags';
import OptionTags from 'components/molecules/OptionTags';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectScheduledEntity,
  selectScheduledTask
} from 'reduxStore/slices/tasks/selectors';
import dayjs from 'dayjs';
import {
  FixedTaskResponseType,
  ICalEventResponseType,
  isICalEvent,
  MinimalScheduledTask,
  ScheduledEntityResponseType,
  ScheduledTaskResponseType,
  TaskType
} from 'types/tasks';
import { selectTaskById } from 'reduxStore/slices/tasks/selectors';
import { TransparentScrollView } from 'components/molecules/ScrollViewComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';
import { Feather } from '@expo/vector-icons';
import { setTaskToAction } from 'reduxStore/slices/calendars/actions';
import UserTags from 'components/molecules/UserTags';
import { EntityTypeName, SchoolTermTypeName } from 'types/entities';
import useHasEditPerms from 'hooks/useHasEditPerms';
import { useNavigation } from '@react-navigation/native';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';
import useCanMarkComplete from 'hooks/useCanMarkComplete';
import TaskCompletionPressable from 'components/molecules/TaskCompletionPressable';
import Checkbox from 'components/molecules/Checkbox';
import { selectIntegrationById } from 'reduxStore/slices/externalCalendars/selectors';

const styles = StyleSheet.create({
  titleContainer: {
    flex: 1
  },
  iconAndTitle: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center'
  },
  title: {
    fontSize: 11,
    textAlign: 'left'
  },
  titleAndTimezoneText: {
    width: '90%'
  },
  timeText: {
    fontSize: 12
  },
  timeZoneText: { fontSize: 8 },
  leftInfo: {
    width: 60,
    marginRight: 5,
    flex: 0
  },
  outerContainer: {
    borderBottomWidth: 1,
    paddingVertical: 5
  },
  containerWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%'
  },
  container: {
    flexShrink: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start'
  },
  bottomWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: '100%'
  },
  tagsWrapper: {
    flexDirection: 'row'
  },
  entityTagsWrapper: { flexShrink: 0, maxWidth: '50%' },
  userTagsWrapper: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    flexGrow: 1
  },
  checkbox: { marginLeft: 10 }
});

export type ScheduledEntity = {
  id: number;
  resourcetype: string;
  recurrence_index: number | null;
};

type PropTypes = {
  task: MinimalScheduledTask;
  date: string;
  isEntity?: boolean;
};

const isScheduledTask = (
  item: ScheduledTaskResponseType | ScheduledEntityResponseType
): item is ScheduledTaskResponseType => {
  return Object.keys(item).includes('date');
};

const TimeText = ({
  scheduledTask,
  date,
  type
}: {
  scheduledTask?: ScheduledTaskResponseType | ScheduledEntityResponseType;
  date: string;
  type?: TaskType;
}) => {
  /*
    If scheduledTask is undefined then this is an entity
  */
  const { t } = useTranslation();

  let textContent = null;
  if (!scheduledTask) {
    textContent = <Text style={styles.timeText}>{t('common.allDay')}</Text>;
  } else if (type && ['BIRTHDAY', 'ANNIVERSARY'].includes(type)) {
    textContent = <Text style={styles.timeText}>{t('common.allDay')}</Text>;
  } else if (scheduledTask.start_date && scheduledTask.end_date) {
    textContent = <Text style={styles.timeText}>{t('common.allDay')}</Text>;
  } else if (isScheduledTask(scheduledTask) && scheduledTask.date) {
    textContent = (
      <Text style={styles.timeText}>
        {`${
          scheduledTask.duration
            ? `${scheduledTask.duration} ${t('common.mins')}, `
            : ' '
        }${t('common.anyTime')}`}
      </Text>
    );
  } else if (scheduledTask.start_datetime && scheduledTask.end_datetime) {
    const startTime = new Date(scheduledTask?.start_datetime || '');
    const startDate = dayjs(startTime).format('YYYY-MM-DD');
    const endTime = new Date(scheduledTask?.end_datetime || '');
    const endDate = dayjs(endTime).format('YYYY-MM-DD');
    const multiDay = startDate !== endDate;

    const currentDate = dayjs(date).format('YYYY-MM-DD');

    const isFirstDay = multiDay && currentDate === startDate;
    const isLastDay = multiDay && currentDate === endDate;

    if (!multiDay) {
      textContent = (
        <>
          <Text style={styles.timeText}>
            {`${getTimeStringFromDateObject(
              new Date(scheduledTask.start_datetime)
            )}`}
          </Text>
          <Text style={styles.timeText}>
            {`${getTimeStringFromDateObject(
              new Date(scheduledTask.end_datetime)
            )}`}
          </Text>
        </>
      );
    } else {
      if (isFirstDay) {
        textContent = (
          <Text style={styles.timeText}>
            {`${
              isFirstDay ? `${t('common.from')} ` : ''
            }${getTimeStringFromDateObject(
              new Date(scheduledTask.start_datetime)
            )}`}
          </Text>
        );
      } else if (isLastDay) {
        textContent = (
          <Text style={styles.timeText}>
            {`${
              isLastDay ? `${t('common.until')} ` : ''
            }${getTimeStringFromDateObject(
              new Date(scheduledTask.end_datetime)
            )}`}
          </Text>
        );
      } else {
        textContent = <Text style={styles.timeText}>{t('common.allDay')}</Text>;
      }
    }
  }

  return (
    <TransparentView style={styles.leftInfo}>{textContent}</TransparentView>
  );
};

const ICalInfo = ({ task }: { task: ICalEventResponseType }) => {
  const { t } = useTranslation();
  const iCalIntegration = useSelector(
    selectIntegrationById(task.ical_integration)
  );

  return (
    <Text style={styles.timeZoneText}>
      {`${t('common.from')} ${
        iCalIntegration
          ? iCalIntegration.ical_name
          : t('components.taskCard.externalCalendar')
      }`}
    </Text>
  );
};

const InfoText = ({
  task,
  scheduledTask,
  date
}: {
  task?: FixedTaskResponseType;
  scheduledTask?: ScheduledTaskResponseType;
  date: string;
}) => {
  const { t } = useTranslation();

  const startTime = new Date(scheduledTask?.start_datetime || '');
  const startDate = dayjs(startTime).format('YYYY-MM-DD');
  const endTime = new Date(scheduledTask?.end_datetime || '');
  const endDate = dayjs(endTime).format('YYYY-MM-DD');
  const multiDay = startDate !== endDate;

  const currentDate = dayjs(date).format('YYYY-MM-DD');

  const isFirstDay = multiDay && currentDate === startDate;
  const isLastDay = multiDay && currentDate === endDate;

  if (
    scheduledTask?.start_datetime &&
    task?.start_timezone &&
    scheduledTask?.end_datetime &&
    task?.end_timezone
  ) {
    const startTimeString = `${
      getTimeInTimezone(scheduledTask?.start_datetime, task?.start_timezone)
        .split('T')[1]
        .split(':00Z')[0]
    } ${task?.start_timezone}`;

    const endTimeString = `${
      getTimeInTimezone(scheduledTask?.end_datetime, task?.end_timezone)
        .split('T')[1]
        .split(':00Z')[0]
    } ${task?.end_timezone}`;

    return (
      <Text style={styles.timeZoneText}>
        {multiDay && isFirstDay && `${t('common.from')} ${startTimeString}`}
        {multiDay && isLastDay && `${t('common.until')} ${endTimeString}`}
        {!multiDay && `${startTimeString} - ${endTimeString}`}
      </Text>
    );
  }

  if (task && isICalEvent(task)) {
    return <ICalInfo task={task} />;
  }

  return null;
};

const TaskIcon = ({ task }: { task: FixedTaskResponseType }) => {
  const iconMappings: {
    [key in TaskType]?: string;
  } = {
    FLIGHT: '✈️',
    TRAIN: '🚟',
    RENTAL_CAR: '🚙',
    TAXI: '🚖',
    DRIVE_TIME: '🚗',
    HOTEL: '🏨',
    STAY_WITH_FRIEND: '🏠',
    ACTIVITY: '🎯',
    OTHER_ACTIVITY: '🎯',
    FOOD_ACTIVITY: '🍲',
    BIRTHDAY: '🎂',
    USER_BIRTHDAY: '🎂',
    ANNIVERSARY: '🍾',
    HOLIDAY: '🎆',
    ICAL_EVENT: '📅'
  };

  const icon = (task?.type && iconMappings[task.type]) || '';

  return icon ? (
    <TransparentView>
      <Text>{`${icon} `}</Text>
    </TransparentView>
  ) : null;
};

const EntityIcon = ({ entity }: { entity: ScheduledEntityResponseType }) => {
  const { t } = useTranslation();
  const iconMappings: {
    [key in EntityTypeName | SchoolTermTypeName]?: string;
  } = {
    SchoolTerm: '📚',
    SchoolTermStart: '📚',
    SchoolTermEnd: '📚',
    SchoolBreak: '📚',
    SchoolYearStart: '🏫',
    SchoolYearEnd: '🏫',
    Trip: '🏝️',
    DaysOff: '🌄',
    Event: `${t('entityResourceTypeNames.Event')}: `
  };

  const icon = (entity.resourcetype && iconMappings[entity.resourcetype]) || '';

  return icon ? (
    <TransparentView>
      <Text bold>{`${icon} `}</Text>
    </TransparentView>
  ) : null;
};

function Task({
  task: { id, recurrence_index, action_id, type },
  date,
  isEntity
}: PropTypes) {
  const task = useSelector(selectTaskById(id));
  const scheduledTask = useSelector(
    selectScheduledTask({
      id,
      recurrenceIndex: recurrence_index,
      actionId: action_id
    })
  );
  const scheduledEntity = useSelector(
    selectScheduledEntity(id, type, recurrence_index)
  );

  const isComplete = !!scheduledTask?.is_complete && !isEntity;
  const isPartiallyComplete = !!scheduledTask?.is_partially_complete;
  const isIgnored = !!scheduledTask?.is_ignored;

  const isCompleteTextColor = useThemeColor({}, 'grey');
  const borderColor = useThemeColor({}, 'grey');
  const blackColor = useThemeColor({}, 'black');

  const dispatch = useDispatch();
  const navigation = useNavigation();

  const hasEditPerms = useHasEditPerms(id);

  const canMarkComplete = useCanMarkComplete({
    taskId: task?.id || -1,
    recurrenceIndex: recurrence_index,
    actionId: action_id
  });

  const isCompleteStyle = {
    color: isCompleteTextColor,
    textDecorationColor: 'black', // Only works on iOS
    textDecorationLine: 'line-through' as 'line-through'
  };

  const isPartiallyCompleteStyle = {
    textDecorationStyle: 'dotted' as 'dotted' // Only works on iOS
  };

  const taskOrEntity = task || scheduledEntity;

  if ((!isEntity && !scheduledTask) || !taskOrEntity) {
    return (
      <TransparentView style={[styles.outerContainer, { height: ITEM_HEIGHT }]}>
        <PaddedSpinner />
      </TransparentView>
    );
  }

  return (
    <>
      <TouchableOpacity
        style={[styles.outerContainer, { height: ITEM_HEIGHT, borderColor }]}
        onPress={() => {
          if (
            !isEntity &&
            scheduledTask &&
            scheduledTask.type !== 'ICAL_EVENT'
          ) {
            dispatch(
              setTaskToAction({
                taskId: scheduledTask.id,
                recurrenceIndex: scheduledTask.recurrence_index,
                actionId: scheduledTask.action_id
              })
            );
          }
        }}
      >
        <TransparentView style={[styles.containerWrapper]}>
          <TransparentView style={styles.container}>
            <TimeText
              scheduledTask={isEntity ? scheduledEntity : scheduledTask}
              date={date}
            />
            <TransparentView style={styles.titleContainer}>
              <TransparentView style={styles.iconAndTitle}>
                {!isEntity && task && <TaskIcon task={task} />}
                {isEntity && scheduledEntity && (
                  <EntityIcon entity={scheduledEntity} />
                )}
                <TransparentView style={[styles.titleAndTimezoneText]}>
                  <BlackText
                    text={
                      isEntity
                        ? scheduledEntity?.title || ''
                        : task
                        ? `${action_id ? 'ACTION - ' : ''}${task.title}`
                        : ''
                    }
                    style={[
                      styles.title,
                      isComplete && isCompleteStyle,
                      isPartiallyComplete && isPartiallyCompleteStyle
                    ]}
                    bold={true}
                    numberOfLines={2}
                  />
                  <InfoText
                    task={task}
                    scheduledTask={scheduledTask}
                    date={date}
                  />
                </TransparentView>
              </TransparentView>
            </TransparentView>
          </TransparentView>
          {!isEntity && hasEditPerms && (
            <TransparentView>
              <Feather name="more-horizontal" size={30} />
            </TransparentView>
          )}
          {[
            'SCHOOL_TERM',
            'SCHOOL_TERM_START',
            'SCHOOL_TERM_END',
            'SCHOOL_BREAK',
            'SCHOOL_YEAR_START',
            'SCHOOL_YEAR_END'
          ].includes(type) && (
            <TouchableOpacity
              onPress={() => {
                (navigation.navigate as any)('ContentNavigator', {
                  screen: 'SchoolTerms',
                  initial: false
                });
              }}
            >
              <Feather name="arrow-right" size={30} />
            </TouchableOpacity>
          )}
          {type === 'ENTITY' && (
            <TouchableOpacity
              onPress={() => {
                (navigation.navigate as any)('ContentNavigator', {
                  screen: 'EntityScreen',
                  params: { entityId: id }
                });
              }}
            >
              <Feather name="arrow-right" size={30} />
            </TouchableOpacity>
          )}
          {canMarkComplete && scheduledTask && !isEntity && (
            <TaskCompletionPressable
              taskId={scheduledTask.id}
              recurrenceIndex={
                scheduledTask.recurrence_index === null
                  ? undefined
                  : scheduledTask.recurrence_index
              }
              actionId={scheduledTask.action_id}
            />
          )}
        </TransparentView>
        <Pressable style={styles.bottomWrapper}>
          <TransparentScrollView
            style={[styles.tagsWrapper, styles.entityTagsWrapper]}
            horizontal
          >
            {!isEntity && task && (
              <>
                <EntityTags entities={task.entities} />
                <OptionTags tagNames={task.tags} />
              </>
            )}
          </TransparentScrollView>
          <TransparentScrollView
            style={styles.tagsWrapper}
            contentContainerStyle={styles.userTagsWrapper}
            horizontal
          >
            <UserTags memberIds={taskOrEntity.members} />
          </TransparentScrollView>
        </Pressable>
      </TouchableOpacity>
    </>
  );
}

export default Task;
