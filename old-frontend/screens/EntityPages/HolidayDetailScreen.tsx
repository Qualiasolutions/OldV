import ListLinkWithCheckbox from 'components/molecules/ListLinkWithCheckbox';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useGetHolidaysQuery } from 'reduxStore/services/api/holidays';
import { Holiday } from 'reduxStore/services/api/types';
import { WhiteView } from 'components/molecules/ViewComponents';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ContentTabParamList } from 'types/base';
import { AlmostBlackText } from 'components/molecules/TextComponents';
import useGetUserDetails from 'hooks/useGetUserDetails';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import { FullPageSpinner } from 'components/molecules/Spinners';
import {
  getDatesPeriodString,
  getUTCValuesFromDateString
} from 'utils/datesAndTimes';
import { SectionList, StyleSheet } from 'react-native';
import SafePressable from 'components/molecules/SafePressable';
import {
  useBulkCreateTasksMutation,
  useBulkDeleteTasksMutation,
  useGetAllTasksQuery
} from 'reduxStore/services/api/tasks';
import { isHolidayTask } from 'types/tasks';

const NUM_YEARS_TO_SHOW = 10;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadMoreButton: {
    padding: 20
  },
  loadMoreButtonText: {
    fontSize: 20
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 20
  },
  headerContainer: {
    borderBottomWidth: 2
  }
});

export default function HolidayDetailScreen({
  navigation,
  route
}: NativeStackScreenProps<ContentTabParamList, 'HolidayDetail'>) {
  const { countrycodes } = route?.params;
  let params = '';

  if (typeof countrycodes === 'string') {
    for (const code of (countrycodes as string).split(',')) {
      params = `${params}country_codes=${code}&`;
    }
  } else {
    for (const code of countrycodes) {
      params = `${params}country_codes=${code}&`;
    }
  }

  const currentYear = new Date().getFullYear();
  for (let i = 0; i <= NUM_YEARS_TO_SHOW; i++) {
    params = `${params}years=${currentYear + i}&`;
  }

  const [monthsAhead, setMonthsAhead] = useState(12);

  const { data: userDetails } = useGetUserDetails();
  const { data: allEntities } = useGetAllEntitiesQuery(undefined, {
    skip: !userDetails?.id
  });
  const { data: allTasks } = useGetAllTasksQuery(undefined, {
    skip: !userDetails?.id
  });

  const previouslySelectedHolidays = useMemo(() => {
    return allTasks ? Object.values(allTasks.byId).filter(isHolidayTask) : [];
  }, [allTasks]);

  const [selectedHolidays, setSelectedHolidays] = useState<
    {
      title: string;
      string_id: string;
      country_code: string;
    }[]
  >([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [createTasks] = useBulkCreateTasksMutation();
  const [deleteTasks] = useBulkDeleteTasksMutation();

  const { data: holidays } = useGetHolidaysQuery(`${params}`);

  useEffect(() => {
    if (
      previouslySelectedHolidays &&
      previouslySelectedHolidays.length > 0 &&
      holidays
    ) {
      setSelectedHolidays(
        Object.values(holidays)
          .flat()
          .filter(
            (hol) =>
              previouslySelectedHolidays
                .map((holiday) => holiday.string_id)
                .includes(hol.id) ||
              previouslySelectedHolidays
                .map((holiday) => `${holiday.title}_${holiday.country_code}`)
                .includes(`${hol.name}_${hol.country_code}`)
          )
          .map((hol) => ({
            ...hol,
            string_id: hol.id,
            title: hol.name
          }))
      );
    }
  }, [allEntities, holidays, previouslySelectedHolidays]);

  const onPress = useCallback(
    (holiday: Holiday, selected: boolean) => {
      if (holidays) {
        if (selected) {
          setSelectedHolidays(
            selectedHolidays.filter(
              (hol) =>
                hol.title !== holiday.name ||
                hol.country_code !== holiday.country_code
            )
          );
        } else {
          const newHolidays = holidays[holiday.country_code].filter(
            (hol) => hol.name === holiday.name
          );
          setSelectedHolidays([
            ...selectedHolidays,
            ...newHolidays.map((hol) => ({
              ...hol,
              string_id: hol.id,
              title: hol.name
            }))
          ]);
        }
      }
    },
    [setSelectedHolidays, selectedHolidays, holidays]
  );

  useEffect(() => {
    const save = async () => {
      if (previouslySelectedHolidays) {
        setIsSaving(true);
        const holidaysToDelete = previouslySelectedHolidays?.filter(
          (entity) =>
            !entity.custom &&
            !selectedHolidays
              .map((ent) => ent.string_id)
              .includes(entity.string_id)
        );
        const holidaysToCreate = selectedHolidays
          ?.filter(
            (entity) =>
              !previouslySelectedHolidays
                .map((ent) => ent.string_id)
                .includes(entity.string_id)
          )
          ?.map((entity) => ({ ...entity, resourcetype: 'Holiday' }));

        if (holidaysToDelete.length > 0) {
          await deleteTasks(holidaysToDelete);
        }

        // Nasty hack to ensure that the second cache update completes
        // before navigating to the next page
        setTimeout(async () => {
          if (holidaysToCreate.length > 0) {
            await createTasks(
              holidaysToCreate.map((holiday) => ({
                ...holiday,
                resourcetype: 'HolidayTask',
                members: userDetails
                  ? userDetails.family.users.map((user) => user.id)
                  : [],
                entities: [],
                type: 'HOLIDAY',
                tags: ['SOCIAL_INTERESTS__HOLIDAY']
              }))
            );
          }

          setTimeout(() => {
            setIsSaving(false);
            navigation.navigate('HolidayDates');
          }, 1000);
        }, 1000);
      }
    };

    navigation.setOptions({
      headerRight: () => <AlmostBlackText text="save" onPress={save} />
    });
  }, [
    selectedHolidays,
    previouslySelectedHolidays,
    createTasks,
    navigation,
    deleteTasks,
    userDetails
  ]);

  const filteredHolidays = useMemo(() => {
    if (!holidays) {
      return [];
    }

    const allHolidays = Object.values(holidays).flat();
    const currentDate = new Date();
    const latestDate = new Date();
    latestDate.setMonth(latestDate.getMonth() + monthsAhead);
    return allHolidays
      .filter((holiday) => {
        const holidayDate = new Date(holiday.start_date);
        return holidayDate <= latestDate && holidayDate >= currentDate;
      })
      .sort((a, b) =>
        new Date(a.start_date) < new Date(b.start_date) ? -1 : 1
      );
  }, [monthsAhead, holidays]);

  if (isSaving || !holidays) return <FullPageSpinner />;

  type SectionDict = {
    [key: string]: {
      title: string;
      data: Holiday[];
    };
  };

  const sectionDict: SectionDict = {};
  for (const holiday of filteredHolidays) {
    const { year: holidayYear, monthName: holidayMonth } =
      getUTCValuesFromDateString(holiday.start_date);
    const monthAndYear = `${holidayMonth} ${holidayYear}`;

    if (sectionDict[monthAndYear]) {
      sectionDict[monthAndYear].data.push(holiday);
    } else {
      sectionDict[monthAndYear] = {
        title: monthAndYear,
        data: [holiday]
      };
    }
  }

  const sectionList = (
    <SectionList
      sections={Object.values(sectionDict)}
      keyExtractor={(holiday) => holiday.id}
      renderItem={({ item: holiday }) => {
        return (
          <ListLinkWithCheckbox
            key={holiday.id}
            text={`${holiday.name} (${holiday.country_code})`}
            subText={`${getDatesPeriodString(
              new Date(holiday.start_date),
              new Date(holiday.end_date),
              true
            )}`}
            showArrow={false}
            onSelect={async (selected) => onPress(holiday, selected)}
            onPressContainer={(selected) => {
              onPress(holiday, !!selected);
            }}
            navMethod={undefined}
            selected={selectedHolidays.some(
              (cou) => cou.string_id === holiday.id
            )}
          />
        );
      }}
      renderSectionHeader={({ section: { title } }) => {
        return (
          <WhiteView style={styles.headerContainer}>
            <AlmostBlackText text={title} style={styles.headerText} />
          </WhiteView>
        );
      }}
      ListFooterComponent={
        monthsAhead < 36 ? (
          <SafePressable
            onPress={() => setMonthsAhead(monthsAhead + 12)}
            style={styles.loadMoreButton}
          >
            <AlmostBlackText
              text={'See more'}
              style={styles.loadMoreButtonText}
            />
          </SafePressable>
        ) : null
      }
    />
  );

  return <WhiteView style={styles.container}>{sectionList}</WhiteView>;
}
