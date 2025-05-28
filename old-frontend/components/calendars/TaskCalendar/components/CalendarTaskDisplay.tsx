import {
  StyleSheet,
  SectionList,
  ViewToken,
  ViewStyle,
  TextStyle
} from 'react-native';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';

import {
  getCurrentDateString,
  getDateStringFromDateObject
} from 'utils/datesAndTimes';

import { Text, useThemeColor } from 'components/Themed';
import dayjs from 'dayjs';
import {
  AlmostWhiteView,
  TransparentView,
  WhitePaddedView
} from 'components/molecules/ViewComponents';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectEnforcedDate,
  selectLastUpdateId
} from 'reduxStore/slices/calendars/selectors';
import Task, { ScheduledEntity } from './Task';
import { ITEM_HEIGHT } from './shared';
import { useTranslation } from 'react-i18next';
import { useGetAllRoutinesQuery } from 'reduxStore/services/api/routines';
import Routine from './Routine';
import { selectTasksInDailyRoutines } from 'reduxStore/slices/tasks/selectors';
import { RESOURCE_TYPE_TO_TYPE } from 'constants/ResourceTypes';
import {
  MinimalScheduledTask,
  ScheduledTask,
  ScheduledTaskType,
  SchoolTermItemType
} from 'types/tasks';
import { useGetAllTasksQuery } from 'reduxStore/services/api/tasks';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import {
  setEnforcedDate,
  setLastUpdateId
} from 'reduxStore/slices/calendars/actions';

const styles = StyleSheet.create({
  sectionHeader: {
    justifyContent: 'center',
    paddingLeft: 18,
    borderTopWidth: 2,
    borderBottomWidth: 2
  },
  sectionHeaderText: {
    fontSize: 18
  },
  noTasksContainer: {
    height: '100%'
  }
});

type ItemData = MinimalScheduledTask;

const isTask = (
  item: ItemData
): item is MinimalScheduledTask & { type: 'TASK' } => {
  return item.type === 'TASK';
};

const isAction = (
  item: ItemData
): item is MinimalScheduledTask & { type: 'ACTION' } => {
  return item.type === 'ACTION';
};

const isRoutine = (
  item: ItemData
): item is MinimalScheduledTask & { type: 'ROUTINE' } => {
  return item.type === 'ROUTINE';
};

const isEntity = (
  item: ItemData
): item is MinimalScheduledTask & { type: 'ENTITY' } => {
  return [
    'ENTITY',
    'SCHOOL_TERM',
    'SCHOOL_TERM_START',
    'SCHOOL_TERM_END',
    'SCHOOL_BREAK',
    'SCHOOL_YEAR_START',
    'SCHOOL_YEAR_END'
  ].includes(item.type);
};

// Pass in the individual values from item because otherwise
// the shallow comparison will detect a change and the memo
// will re-compute
const ListItem = React.memo(
  ({
    date,
    id,
    recurrence_index,
    action_id,
    type
  }: {
    date: string;
    id: number;
    recurrence_index: number | null;
    action_id: number | null;
    type: ScheduledTaskType | SchoolTermItemType | 'ROUTINE' | 'ENTITY';
  }) => {
    const data = { id, recurrence_index, action_id, type };
    if (isTask(data)) {
      return <Task task={data} date={date} />;
    }
    if (isAction(data)) {
      return <Task task={data} date={date} />;
    }
    if (isRoutine(data)) {
      return <Routine id={data.id} date={date} />;
    }
    if (isEntity(data)) {
      return <Task task={data} date={date} isEntity={true} />;
    }
    return null;
  }
);

const SECTION_HEADER_HEIGHT = 40;

function Calendar({
  tasks,
  entities,
  onChangeFirstDate,
  headerStyle,
  headerTextStyle,
  reverse
}: {
  tasks: { [date: string]: ScheduledTask[] };
  entities?: { [date: string]: ScheduledEntity[] };
  alwaysIncludeCurrentDate?: boolean;
  onChangeFirstDate?: (date: string) => void;
  headerStyle?: ViewStyle;
  headerTextStyle?: TextStyle;
  reverse?: boolean;
}) {
  const enforcedDate = useSelector(selectEnforcedDate);
  const lastUpdateId = useSelector(selectLastUpdateId);
  const tasksPerRoutine = useSelector(selectTasksInDailyRoutines);
  const sectionListRef = useRef<any>(null);
  const { t } = useTranslation();
  const { data: allRoutines } = useGetAllRoutinesQuery(undefined);
  const { data: allTasks } = useGetAllTasksQuery(undefined);
  const { data: allEntities } = useGetAllEntitiesQuery(undefined);
  const lightYellowColor = useThemeColor({}, 'lightYellow');
  const blackColor = useThemeColor({}, 'black');
  const dispatch = useDispatch();

  const currentDate = useMemo(() => {
    return new Date(getCurrentDateString());
  }, []);

  const updateDate = useCallback(
    (newDate: string) => {
      if (onChangeFirstDate && newDate) {
        onChangeFirstDate(newDate);
      }
    },
    [onChangeFirstDate]
  );

  const noTasks =
    Object.keys(tasks).length === 0 &&
    (!entities || Object.keys(entities).length === 0);

  const sectionsData = useMemo(() => {
    const datesToShow = Array(
      ...new Set([...Object.keys(entities || {}), ...Object.keys(tasks)])
    ).sort();

    if (!allRoutines) {
      return [];
    }

    const sections: { title: string; key: string; data: ItemData[] }[] = [];

    for (const date of datesToShow) {
      const sectionsArray = sections;

      const dayJsDate = dayjs(date);

      const format =
        dayJsDate.year() === currentDate.getFullYear()
          ? 'dd DD MMM'
          : 'dd DD MMM YYYY';
      const dayName = dayJsDate.format(format);

      const dailyTasksPerRoutine = tasksPerRoutine[date];

      if (!entities && !dailyTasksPerRoutine) {
        continue;
      }

      // We want to only show the filtered tasks / entities
      const permittedTasksOnDate = tasks[date];
      const permittedEntitiesOnDate = entities && entities[date];

      if (!(permittedTasksOnDate || permittedEntitiesOnDate)) {
        continue;
      }

      const routinesToShow = Object.keys(dailyTasksPerRoutine || {})
        .map((routineId) => parseInt(routineId))
        .filter(
          (routineId) =>
            routineId !== -1 &&
            permittedTasksOnDate?.some(({ id: taskId }) =>
              dailyTasksPerRoutine[routineId]
                .map((tsk) => tsk.id)
                .includes(taskId)
            )
        )
        .map((routineId) => {
          const routine = allRoutines.byId[routineId];
          const startDatetime = `${date}T${routine.start_time}`;
          return {
            ...routine,
            start_datetime: startDatetime,
            type: 'ROUTINE' as 'ROUTINE'
          };
        });

      const tasksToShow = dailyTasksPerRoutine
        ? (permittedTasksOnDate || []).filter(({ id: taskId, action_id }) => {
            if (action_id) {
              return dailyTasksPerRoutine[-1]
                .map((tsk) => tsk.action_id)
                .includes(action_id);
            }
            return dailyTasksPerRoutine[-1]
              .map((tsk) => tsk.id)
              .includes(taskId);
          })
        : [];

      const entitiesToShow = permittedEntitiesOnDate || [];

      const routineAndTaskData = [...routinesToShow, ...tasksToShow]
        .sort((a, b) => {
          if (!a.start_datetime) {
            return -1;
          }
          if (!b.start_datetime) {
            return 1;
          }
          return a.start_datetime < b.start_datetime ? -1 : 1;
        })
        .map((routineOrTask) => {
          if (routineOrTask.type === 'ROUTINE') {
            return {
              id: routineOrTask.id,
              recurrence_index: null,
              action_id: null,
              type: 'ROUTINE' as 'ROUTINE'
            };
          }
          return routineOrTask;
        });

      const hoistedTasks = routineAndTaskData
        .filter((task) => {
          return (
            task.type === 'TASK' &&
            allTasks?.byId[task.id]?.type &&
            ['HOLIDAY', 'ANNIVERSARY', 'BIRTHDAY'].includes(
              allTasks?.byId[task.id].type
            )
          );
        })
        .sort((taskA, taskB) => {
          if (allTasks?.byId[taskA.id].type === 'HOLIDAY') {
            return -1;
          }
          return 1;
        });
      const nonHoistedTasks = routineAndTaskData
        .filter((task) => {
          return !hoistedTasks.includes(task);
        })
        .sort((taskA, taskB) => {
          if (
            taskA.type === 'TASK' &&
            allTasks?.byId[taskA.id]?.type === 'DUE_DATE'
          ) {
            return -1;
          }
          if (
            taskB.type === 'TASK' &&
            allTasks?.byId[taskB.id]?.type === 'DUE_DATE'
          ) {
            return 1;
          }
          if (taskA.date) {
            return 1;
          }
          if (taskB.date) {
            return -1;
          }
          return taskA.start_datetime &&
            taskB.start_datetime &&
            taskA.start_datetime < taskB.start_datetime
            ? -1
            : 1;
        });

      const sectionData = [
        ...hoistedTasks,
        ...entitiesToShow
          .map(({ id, resourcetype, recurrence_index }) => ({
            id,
            recurrence_index,
            action_id: null,
            type: (RESOURCE_TYPE_TO_TYPE[resourcetype] || 'ENTITY') as
              | SchoolTermItemType
              | 'ENTITY'
          }))
          .sort((entityA, entityB) => {
            if (
              entityA.type === 'ENTITY' &&
              allEntities?.byId[entityA.id]?.resourcetype === 'DaysOff'
            ) {
              return -1;
            }
            if (
              entityA.type === 'ENTITY' &&
              allEntities?.byId[entityA.id]?.resourcetype === 'Trip' &&
              !(
                entityB.type === 'ENTITY' &&
                allEntities?.byId[entityB.id]?.resourcetype === 'DaysOff'
              )
            ) {
              return -1;
            }
            if (entityA.type !== 'ENTITY') {
              return 1;
            }
            return 1;
          }),
        ...nonHoistedTasks
      ];

      sectionsArray.push({
        title: dayName,
        key: dayJsDate.format('YYYY-MM-DD'),
        data: sectionData
      });
    }
    return sections;
  }, [
    tasks,
    allRoutines,
    tasksPerRoutine,
    entities,
    currentDate,
    allEntities,
    allTasks
  ]);

  useEffect(() => {
    if (!enforcedDate) {
      const today = getCurrentDateString();
      dispatch(setEnforcedDate({ date: today }));
      dispatch(setLastUpdateId(String(new Date())));
    }

    const newDate = enforcedDate ? new Date(enforcedDate) : new Date();
    const datesToShow = Array(
      ...new Set([...Object.keys(entities || {}), ...Object.keys(tasks)])
    ).sort();
    let sectionIndex = 0;
    for (const date of datesToShow) {
      const dateObj = new Date(date);
      if (dateObj < newDate) {
        sectionIndex += 1;
      }
    }

    if (sectionIndex >= 0 && sectionIndex < datesToShow.length) {
      // SCROLL TO THE RIGHT DATE
      try {
        if (sectionListRef.current) {
          sectionListRef.current.scrollToLocation({
            sectionIndex,
            itemIndex: 0,
            // If animated is true, the checkboxes become unclickable
            // when we scroll. This is a workaround to fix that.
            animated: false
          });
        } else {
          // Set a timeout because sometimes this doesn't work
          // on initial render otherwise
          setTimeout(() => {
            if (sectionListRef.current) {
              sectionListRef.current.scrollToLocation({
                sectionIndex,
                itemIndex: 0
              });
            }
          }, 100);
        }
      } catch (err) {
        console.error(err);
      }
    }
    return;
  }, [
    lastUpdateId // This marks whether to actually update the location
  ]);

  const shownSections = useMemo(() => {
    const sections = [...sectionsData];

    if (reverse) {
      sections.reverse();
    }
    return sections;
  }, [sectionsData, reverse]);

  const HORIZONTAL_PADDING = 20;
  const renderItem = useCallback(
    ({ section, item }: { item: ItemData; section: { key: string } }) => {
      return (
        <TransparentView style={{ paddingHorizontal: HORIZONTAL_PADDING }}>
          <ListItem
            date={section.key}
            id={item.id}
            recurrence_index={item.recurrence_index}
            action_id={item.action_id}
            type={item.type}
          />
        </TransparentView>
      );
    },
    []
  );
  const onViewableItemsChanged = useCallback(
    (items: { viewableItems: ViewToken[] }) => {
      if (onChangeFirstDate) {
        if (items.viewableItems[0]?.section?.key) {
          const newDate = getDateStringFromDateObject(
            new Date(items.viewableItems[0]?.section?.key)
          );
          updateDate(newDate);
        }
      }
    },
    [onChangeFirstDate, updateDate]
  );

  const keyExtractor = useCallback((item: ItemData) => {
    return `${item.id}_${item.recurrence_index}_${item.type}`;
  }, []);

  const itemsLayout = useMemo(() => {
    if (!shownSections) return [];
    const layouts: any[] = [];
    let index = 0;
    let offset = 0;
    shownSections.forEach((section) => {
      // Section header
      const TOTAL_HEADER_HEIGHT = SECTION_HEADER_HEIGHT;
      layouts[index] = { length: TOTAL_HEADER_HEIGHT, offset, index };
      index++;
      offset += TOTAL_HEADER_HEIGHT;

      // Section items
      section.data.forEach(() => {
        /* -----------------------
         * We need to remove the last ItemSeparator from our calculations otherwise
         * we might offset our layout a little. As per the documentation, a ItemSeparatorComponent is
         * "Rendered in between adjacent Items within each section."
         * ----------------------- */
        const MATCH_HEIGHT = ITEM_HEIGHT;
        layouts[index] = {
          length: MATCH_HEIGHT,
          offset,
          index
        };
        index++;
        offset += MATCH_HEIGHT;
      });

      // Section footer
      layouts[index] = { length: 0, offset, index };
      index++;
    });
    return layouts;
  }, [shownSections]);

  const PADDING_BOTTOM = 300;

  return (
    <>
      <SectionList
        sections={shownSections}
        initialNumToRender={10}
        scrollEventThrottle={1000}
        renderSectionHeader={({ section }) => {
          return (
            <AlmostWhiteView
              style={[
                styles.sectionHeader,
                {
                  height: SECTION_HEADER_HEIGHT,
                  backgroundColor: lightYellowColor,
                  borderColor: blackColor
                },
                headerStyle
              ]}
            >
              <Text style={[styles.sectionHeaderText, headerTextStyle]}>
                {section.title}
              </Text>
            </AlmostWhiteView>
          );
        }}
        refreshing={false}
        renderItem={renderItem}
        contentContainerStyle={noTasks ? {} : { paddingBottom: PADDING_BOTTOM }}
        onViewableItemsChanged={onViewableItemsChanged}
        getItemLayout={(d, index) =>
          itemsLayout[index] ?? { length: 0, offset: 0, index }
        }
        keyExtractor={keyExtractor}
        ref={sectionListRef}
        windowSize={31}
      />
      {noTasks && (
        <WhitePaddedView style={styles.noTasksContainer}>
          <Text>{t('components.calendar.noTasks')}</Text>
        </WhitePaddedView>
      )}
    </>
  );
}

export default Calendar;
