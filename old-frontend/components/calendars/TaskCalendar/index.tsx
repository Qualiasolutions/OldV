/*
  TaskCalendar - this is a calendar component for displaying tasks
*/

import CalendarTaskDisplay from './components/CalendarTaskDisplay';
import React, { useMemo, useState } from 'react';
import { StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { useDispatch } from 'react-redux';
import { RESOURCE_TYPE_TO_TYPE } from 'constants/ResourceTypes';

import {
  TransparentView,
  WhitePaddedView,
  WhiteView
} from 'components/molecules/ViewComponents';
import dayjs from 'dayjs';
import { FullPageSpinner } from 'components/molecules/Spinners';
import utc from 'dayjs/plugin/utc';
import CalendarView from 'components/molecules/CalendarViewV2';
import {
  getCurrentDateString,
  getDateStringFromDateObject
} from 'utils/datesAndTimes';
import {
  setEnforcedDate,
  setFiltersModalOpen,
  setLastUpdateId
} from 'reduxStore/slices/calendars/actions';
import MonthSelector from './components/MonthSelector';
import { ScheduledEntity } from './components/Task';
import {
  useGetAllScheduledTasksQuery,
  useGetAllTasksQuery
} from 'reduxStore/services/api/tasks';
import { TouchableOpacity } from 'components/molecules/TouchableOpacityComponents';
import Search from 'components/molecules/Search';
import { Feather } from '@expo/vector-icons';
import { elevation } from 'styles/elevation';
import { useThemeColor } from 'components/Themed';
import { ScheduledTask } from 'types/tasks';
import { PrimaryText } from 'components/molecules/TextComponents';
import { t } from 'i18next';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import RadioInput from 'components/forms/components/RadioInput';
import { isProfessionalEntity } from 'types/entities';
import TaskActionModal from 'components/molecules/TaskActionModal';
import TaskPartialCompletionModal from 'components/organisms/TaskPartialCompletionModal';
import TaskRescheduleModal from 'components/organisms/TaskRescheduleModal';
import FiltersModal from 'components/organisms/FiltersModal';

dayjs.extend(utc);

const MARGIN_BOTTOM = 0;

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%'
  },
  monthSelectorSection: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginBottom: 3
  },
  searchBox: {
    marginBottom: 3
  },
  monthSelectorWrapper: {
    marginRight: 20
  },
  todayButton: {
    marginHorizontal: 6
  },
  headerButton: { alignItems: 'center', marginHorizontal: 6 },
  headerButtonText: { fontSize: 11 },
  proButtonsContainerStyle: { flexDirection: 'row' },
  proCheckboxWrapperStyle: { marginRight: 20 },
  proCheckboxStyle: { marginRight: 4 }
});

type ProfessionalFilterType = 'ALL' | 'PROFESSIONAL' | 'PERSONAL';

type CalendarProps = {
  showFilters?: boolean;
  showProFilters?: boolean;
  reverse?: boolean;
  headerStyle?: ViewStyle;
  headerTextStyle?: TextStyle;
  filteredTasks: {
    [key: string]: ScheduledTask[];
  };
  filteredEntities?: { [key: string]: ScheduledEntity[] };
};
function Calendar({
  filteredTasks,
  filteredEntities,
  showFilters,
  showProFilters,
  reverse,
  headerStyle,
  headerTextStyle
}: CalendarProps) {
  const { isLoading: isLoadingScheduledTasks, data: allScheduled } =
    useGetAllScheduledTasksQuery(undefined);
  const { isLoading: isLoadingTasks } = useGetAllTasksQuery(undefined);
  const { data: entityData } = useGetAllEntitiesQuery(undefined);

  const dispatch = useDispatch();

  const primaryColor = useThemeColor({}, 'primary');
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [submittedSearchText, setSubmittedSearchText] = useState('');
  const [proFilter, setProFilter] = useState<ProfessionalFilterType>('ALL');

  const fullFilteredTasks = useMemo(() => {
    if (!entityData) {
      return {};
    }
    const full: { [date: string]: ScheduledTask[] } = {};
    for (const date in filteredTasks) {
      const filtered = filteredTasks[date].filter((task) => {
        const scheduledTask = allScheduled?.byTaskId[task.id]
          ? allScheduled?.byTaskId[task.id][
              task.recurrence_index === null ? -1 : task.recurrence_index
            ]
          : null;

        if (!scheduledTask) {
          return false;
        }

        const hasEntitites =
          scheduledTask.entities && scheduledTask.entities.length > 0;
        if (proFilter === 'PROFESSIONAL' && !hasEntitites) {
          return false;
        }

        const isProfessional = scheduledTask.entities.some((entityId) =>
          isProfessionalEntity(entityData.byId[entityId])
        );
        const isPersonal =
          scheduledTask.entities.length === 0 ||
          scheduledTask.entities.some(
            (entityId) => !isProfessionalEntity(entityData.byId[entityId])
          );

        const matchesEntityString = scheduledTask.entities.some((entityId) =>
          entityData.byId[entityId]?.name
            ?.toLowerCase()
            .includes(submittedSearchText.toLowerCase())
        );

        const matchesTagString = scheduledTask.tags.some((tagName) =>
          tagName.toLowerCase().includes(submittedSearchText.toLowerCase())
        );
        const matchesTitleString = scheduledTask.title
          .toLowerCase()
          .includes(submittedSearchText.toLowerCase());

        if (proFilter === 'PROFESSIONAL' && !isProfessional) {
          return false;
        }
        if (proFilter === 'PERSONAL' && !isPersonal) {
          return false;
        }

        return matchesEntityString || matchesTagString || matchesTitleString;
      });
      if (filtered.length > 0) {
        full[date] = filtered;
      }
    }
    return full;
  }, [filteredTasks, submittedSearchText, entityData, proFilter, allScheduled]);

  const fullFilteredEntities = useMemo(() => {
    const full: { [date: string]: ScheduledEntity[] } = {};
    for (const date in filteredEntities) {
      const filtered = filteredEntities[date].filter((entity) => {
        if (
          proFilter === 'PROFESSIONAL' &&
          entity.resourcetype !== 'ProfessionalEntity'
        ) {
          return false;
        }
        if (
          proFilter === 'PERSONAL' &&
          entity.resourcetype === 'ProfessionalEntity'
        ) {
          return false;
        }

        return allScheduled?.byEntityId[
          RESOURCE_TYPE_TO_TYPE[entity.resourcetype] || 'ENTITY'
        ][entity.id][
          entity.recurrence_index === null ? -1 : entity.recurrence_index
        ].title
          .toLowerCase()
          .includes(submittedSearchText.toLowerCase());
      });
      if (filtered.length > 0) {
        full[date] = filtered;
      }
    }
    return full;
  }, [filteredEntities, submittedSearchText, proFilter, allScheduled]);

  const calendarView = useMemo(() => {
    return (
      <CalendarView
        tasks={fullFilteredTasks}
        entities={fullFilteredEntities}
        onChangeDate={(date) => {
          dispatch(setEnforcedDate({ date }));
        }}
      />
    );
  }, [fullFilteredTasks, fullFilteredEntities, dispatch]);

  const listView = useMemo(() => {
    return (
      <TransparentView
        style={[styles.container, { marginBottom: MARGIN_BOTTOM }]}
      >
        <CalendarTaskDisplay
          tasks={fullFilteredTasks}
          entities={fullFilteredEntities}
          alwaysIncludeCurrentDate={true}
          onChangeFirstDate={(date) => {
            dispatch(setEnforcedDate({ date }));
          }}
          reverse={reverse}
          headerStyle={headerStyle}
          headerTextStyle={headerTextStyle}
        />
      </TransparentView>
    );
  }, [
    fullFilteredTasks,
    fullFilteredEntities,
    reverse,
    headerStyle,
    headerTextStyle,
    dispatch
  ]);

  const isLoading = isLoadingScheduledTasks || isLoadingTasks || !entityData;
  if (isLoading) {
    return <FullPageSpinner />;
  }

  return (
    <TransparentView style={styles.container}>
      <TransparentView>
        <WhitePaddedView
          style={[styles.monthSelectorSection, elevation.elevated]}
        >
          <TransparentView style={styles.monthSelectorWrapper}>
            <MonthSelector
              onValueChange={(date) => {
                if (date) {
                  const dateString = getDateStringFromDateObject(date);
                  dispatch(setEnforcedDate({ date: dateString }));
                  dispatch(setLastUpdateId(String(new Date())));
                }
              }}
            />
          </TransparentView>
          <TouchableOpacity
            onPress={() => {
              setShowCalendar(!showCalendar);
            }}
            style={styles.headerButton}
          >
            <Feather
              name={showCalendar ? 'list' : 'calendar'}
              size={20}
              color={primaryColor}
            />
            <PrimaryText
              style={styles.headerButtonText}
              text={showCalendar ? t('common.list') : t('common.month')}
            />
          </TouchableOpacity>
          {showFilters && (
            <TouchableOpacity
              onPress={() => {
                dispatch(setFiltersModalOpen(true));
              }}
              style={styles.headerButton}
            >
              <Feather name={'sliders'} size={20} color={primaryColor} />
              <PrimaryText
                style={styles.headerButtonText}
                text={t('components.calendar.filters')}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={() => {
              const today = getCurrentDateString();
              dispatch(setEnforcedDate({ date: today }));
              dispatch(setLastUpdateId(String(new Date())));
            }}
            style={styles.headerButton}
          >
            <Feather name={'sun'} size={20} color={primaryColor} />
            <PrimaryText
              style={styles.headerButtonText}
              text={t('common.today')}
            />
          </TouchableOpacity>
        </WhitePaddedView>
        <WhitePaddedView style={[elevation.elevated, styles.searchBox]}>
          <Search
            value={searchText}
            onChangeText={setSearchText}
            onSubmit={setSubmittedSearchText}
          />
        </WhitePaddedView>
        {showProFilters && (
          <WhitePaddedView style={[elevation.elevated, styles.searchBox]}>
            <RadioInput
              value={proFilter}
              onValueChange={(val) => setProFilter(val.id)}
              permittedValues={
                [
                  {
                    label: 'All',
                    value: { id: 'ALL' }
                  },
                  {
                    label: 'Personal',
                    value: { id: 'PERSONAL' }
                  },
                  {
                    label: 'Professional',
                    value: { id: 'PROFESSIONAL' }
                  }
                ] as { label: string; value: { id: ProfessionalFilterType } }[]
              }
              buttonsContainerStyle={styles.proButtonsContainerStyle}
              checkboxWrapperStyle={styles.proCheckboxWrapperStyle}
              checkboxStyle={styles.proCheckboxStyle}
            />
          </WhitePaddedView>
        )}
      </TransparentView>
      <WhiteView>{showCalendar ? calendarView : listView}</WhiteView>
      <TaskActionModal />
      <TaskPartialCompletionModal />
      <TaskRescheduleModal />
      <FiltersModal />
    </TransparentView>
  );
}

export default Calendar;
