import { useThemeColor } from 'components/Themed';

import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import {
  TransparentView,
  WhitePaddedView
} from 'components/molecules/ViewComponents';
import { StyleSheet } from 'react-native';
import { FullPageSpinner } from 'components/molecules/Spinners';
import useGetUserDetails from 'hooks/useGetUserDetails';
import useColouredHeader from 'headers/hooks/useColouredHeader';
import dayjs from 'dayjs';
import { RootTabScreenProps } from 'types/base';
import DropDown from 'components/forms/components/DropDown';
import { BlackText } from 'components/molecules/TextComponents';
import EntityAndTagSelector from 'components/forms/components/TagSelector';
import { FieldValueTypes } from 'components/forms/types';
import {
  AnniversaryTaskType,
  TransportTaskType,
  AccommodationTaskType,
  ActivityTaskType
} from 'types/tasks';
import GenericTaskForm from 'components/forms/GenericTaskForm';
import {
  setEnforcedDate,
  setLastUpdateId
} from 'reduxStore/slices/calendars/actions';
import { useDispatch } from 'react-redux';
import { getDateStringFromDateObject } from 'utils/datesAndTimes';

const formTypes = [
  {
    value: 'TASK',
    label: 'Task'
  },
  {
    value: 'APPOINTMENT',
    label: 'Appointment'
  },
  {
    value: 'DUE_DATE',
    label: 'Due Date'
  },
  {
    value: 'ACTIVITY',
    label: 'Going Out'
  },
  {
    value: 'TRANSPORT',
    label: 'Getting There'
  },
  {
    value: 'ACCOMMODATION',
    label: 'Staying Overnight'
  },
  {
    value: 'ANNIVERSARY',
    label: 'Birthday / Anniversary'
  }
];

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100
  },
  typeSelector: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  hidden: {
    height: 0,
    overflow: 'hidden'
  },
  addNewLabel: {
    marginRight: 10
  },
  dropdownContainer: {
    flex: 1
  },
  bottomButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center'
  }
});

type AddTaskScreenProps = RootTabScreenProps<'AddTask'>;

export type FormType =
  | 'TASK'
  | 'APPOINTMENT'
  | 'DUE_DATE'
  | 'ACTIVITY'
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'HOLIDAY'
  | 'USER_BIRTHDAY'
  | 'ANNIVERSARY';

export default function AddTaskScreen({
  route,
  navigation
}: AddTaskScreenProps) {
  const { t } = useTranslation();
  const { data: userDetails } = useGetUserDetails();
  const dispatch = useDispatch();

  const [tagsAndEntities, setTagsAndEntities] = useState<{
    tags: string[];
    entities: number[];
  }>({
    tags: route.params.tags || [],
    entities: route.params.entities || []
  });
  const [formType, setFormType] = useState<FormType | ''>(
    route.params?.type || ''
  );
  const [anniversaryType, setAnniversaryType] =
    useState<AnniversaryTaskType>('BIRTHDAY');
  const [transportType, setTransportType] =
    useState<TransportTaskType>('FLIGHT');
  const [accommodationType, setAccomodationType] =
    useState<AccommodationTaskType>('HOTEL');
  const [activityType, setActivityType] =
    useState<ActivityTaskType>('ACTIVITY');

  const [taskFieldValues, setTaskFieldValues] =
    useState<FieldValueTypes | null>(null);

  const headerBackgroundColor = useThemeColor({}, 'secondary');
  const headerTintColor = useThemeColor({}, 'white');
  const headerTitle = {
    '': 'Add task',
    TASK: 'Add task',
    APPOINTMENT: 'Add Appointment',
    ACTIVITY: 'Add Activity',
    DUE_DATE: 'Add Due Date',
    TRANSPORT: 'Add Transport',
    ACCOMMODATION: 'Add Accommodation',
    HOLIDAY: 'Add Holiday',
    ANNIVERSARY: 'Add Birthday / Anniversary',
    USER_BIRTHDAY: 'Add User Birthday'
  }[formType];

  useColouredHeader(headerBackgroundColor, headerTintColor, headerTitle);

  useEffect(() => {
    setFormType(route.params?.type || '');
  }, [route]);

  const taskDefaults = useMemo(() => {
    const currentTime = new Date();
    const defaultStartTime = new Date(currentTime);
    defaultStartTime.setMinutes(0);
    defaultStartTime.setSeconds(0);
    defaultStartTime.setMilliseconds(0);
    defaultStartTime.setHours(defaultStartTime.getHours() + 1);

    const defaultEndTime = new Date(defaultStartTime);
    defaultEndTime.setHours(defaultStartTime.getHours() + 1);

    const defaultDuration = 15;
    const dateNow = new Date();
    const defaultDueDate =
      route.params?.date || dayjs(dateNow).format('YYYY-MM-DD');

    const parsedDefaultDueDate = new Date(defaultDueDate || '');
    // Date fields should be the same in all timezones
    const timezoneIgnorantDueDate = new Date(
      parsedDefaultDueDate.getUTCFullYear(),
      parsedDefaultDueDate.getUTCMonth(),
      parsedDefaultDueDate.getUTCDate()
    );

    return {
      title: route.params?.title || '',
      start_datetime: defaultStartTime,
      end_datetime: defaultEndTime,
      date: timezoneIgnorantDueDate,
      duration: defaultDuration,
      recurrence: route.params?.recurrence || null,
      earliest_action_date: timezoneIgnorantDueDate,
      due_date: timezoneIgnorantDueDate,
      members: route.params?.members || (userDetails ? [userDetails.id] : []),
      actions: [],
      reminders: [],
      tagsAndEntities: {
        entities: route.params?.entities || [],
        tags: route.params?.tags || []
      }
    };
  }, [route.params, userDetails]);

  useEffect(() => {
    if (taskDefaults) {
      setTaskFieldValues(taskDefaults);
    }
  }, [taskDefaults]);

  useEffect(() => {
    setTagsAndEntities({
      tags: route.params?.tags || [],
      entities: route.params?.entities || []
    });
  }, [route.params]);

  useEffect(() => {
    if (formType === 'ANNIVERSARY') {
      setTaskFieldValues((vals) => ({
        ...vals,
        recurrence: {
          earliest_occurrence: null,
          latest_occurrence: null,
          interval_length: 1,
          recurrence: 'YEARLY'
        }
      }));
    } else {
      setTaskFieldValues((vals) => ({
        ...vals,
        recurrence: null
      }));
    }
  }, [formType]);

  const taskType = useMemo(() => {
    return formType === 'ANNIVERSARY'
      ? anniversaryType
      : formType === 'ACCOMMODATION'
      ? accommodationType
      : formType === 'TRANSPORT'
      ? transportType
      : formType === 'ACTIVITY'
      ? activityType
      : formType;
  }, [
    formType,
    anniversaryType,
    accommodationType,
    transportType,
    activityType
  ]);

  useEffect(() => {
    if (formType === 'ANNIVERSARY') {
      const otherTaskType =
        taskType === 'ANNIVERSARY' ? 'BIRTHDAY' : 'ANNIVERSARY';
      setTagsAndEntities((currentTagsAndEntities) => {
        const newTags = currentTagsAndEntities.tags.includes(
          `SOCIAL_INTERESTS__${taskType}`
        )
          ? currentTagsAndEntities.tags
          : [
              ...currentTagsAndEntities.tags.filter(
                (tag) => tag !== `SOCIAL_INTERESTS__${otherTaskType}`
              ),
              `SOCIAL_INTERESTS__${taskType}`
            ];
        return {
          entities: currentTagsAndEntities.entities,
          tags: newTags
        };
      });
    } else {
      setTagsAndEntities((currentTagsAndEntities) => {
        const newTags = currentTagsAndEntities.tags.filter(
          (tag) =>
            ![
              `SOCIAL_INTERESTS__BIRTHDAY`,
              'SOCIAL_INTERESTS__ANNIVERSARY'
            ].includes(tag)
        );
        return {
          entities: currentTagsAndEntities.entities,
          tags: newTags
        };
      });
    }
  }, [formType, taskType]);

  if (!userDetails) {
    return <FullPageSpinner />;
  }

  if (!taskFieldValues) {
    return <FullPageSpinner />;
  }

  const tagsChosen =
    tagsAndEntities.entities.length > 0 ||
    tagsAndEntities.tags.filter(
      (tag) =>
        ![
          `SOCIAL_INTERESTS__BIRTHDAY`,
          'SOCIAL_INTERESTS__ANNIVERSARY'
        ].includes(tag)
    ).length > 0;

  const formTypeOptions = formTypes.map((option) => {
    if (!tagsChosen && option.value !== 'ANNIVERSARY') {
      return { ...option, disabled: true };
    }
    return option;
  });

  const showForm = tagsChosen || formType === 'ANNIVERSARY';

  return (
    <TransparentFullPageScrollView>
      <TransparentView style={styles.container}>
        <TransparentView>
          <WhitePaddedView>
            <EntityAndTagSelector
              value={tagsAndEntities}
              onChange={(newTagsAndEntities) => {
                setTagsAndEntities(newTagsAndEntities);
              }}
              extraTagOptions={
                formType === 'ANNIVERSARY'
                  ? taskType === 'BIRTHDAY'
                    ? {
                        SOCIAL_INTERESTS: [
                          {
                            value: 'SOCIAL_INTERESTS__BIRTHDAY',
                            label: t('tags.SOCIAL_INTERESTS__BIRTHDAY')
                          }
                        ]
                      }
                    : {
                        SOCIAL_INTERESTS: [
                          {
                            value: 'SOCIAL_INTERESTS__ANNIVERSARY',
                            label: t('tags.SOCIAL_INTERESTS__ANNIVERSARY')
                          }
                        ]
                      }
                  : {}
              }
            />
          </WhitePaddedView>
          <WhitePaddedView style={styles.typeSelector}>
            <BlackText text={t('common.addNew')} style={styles.addNewLabel} />
            <DropDown
              value={formType}
              items={formTypeOptions}
              setFormValues={(value) => {
                setFormType(value as FormType);
              }}
              listMode="MODAL"
              containerStyle={styles.dropdownContainer}
            />
          </WhitePaddedView>
          {showForm && (
            <>
              {formType === 'ANNIVERSARY' && (
                <WhitePaddedView>
                  <DropDown
                    value={anniversaryType}
                    items={[
                      {
                        value: 'BIRTHDAY',
                        label: 'Birthday'
                      },
                      {
                        value: 'ANNIVERSARY',
                        label: 'Anniversary'
                      }
                    ]}
                    setFormValues={setAnniversaryType}
                    listMode="MODAL"
                  />
                </WhitePaddedView>
              )}
              {formType === 'TRANSPORT' && (
                <WhitePaddedView>
                  <DropDown
                    value={transportType}
                    items={[
                      {
                        value: 'FLIGHT',
                        label: 'Flight'
                      },
                      {
                        value: 'TRAIN',
                        label: 'Train / Public Transport'
                      },
                      {
                        value: 'RENTAL_CAR',
                        label: 'Rental Car'
                      },
                      {
                        value: 'TAXI',
                        label: 'Taxi'
                      },
                      {
                        value: 'DRIVE_TIME',
                        label: 'Drive Time'
                      }
                    ]}
                    setFormValues={setTransportType}
                    listMode="MODAL"
                  />
                </WhitePaddedView>
              )}
              {formType === 'ACCOMMODATION' && (
                <WhitePaddedView>
                  <DropDown
                    value={accommodationType}
                    items={[
                      {
                        value: 'HOTEL',
                        label: 'Hotel'
                      },
                      {
                        value: 'STAY_WITH_FRIEND',
                        label: 'Stay With Friend'
                      }
                    ]}
                    setFormValues={setAccomodationType}
                    listMode="MODAL"
                  />
                </WhitePaddedView>
              )}
              {formType === 'ACTIVITY' && (
                <WhitePaddedView>
                  <DropDown
                    value={activityType}
                    items={[
                      {
                        value: 'ACTIVITY',
                        label: 'Activity'
                      },
                      {
                        value: 'FOOD_ACTIVITY',
                        label: 'Food'
                      },
                      {
                        value: 'OTHER_ACTIVITY',
                        label: 'Other'
                      }
                    ]}
                    setFormValues={setActivityType}
                    listMode="MODAL"
                  />
                </WhitePaddedView>
              )}
              {taskType && (
                <GenericTaskForm
                  type={taskType}
                  defaults={taskFieldValues}
                  extraFields={tagsAndEntities}
                  onSuccess={(vals) => {
                    setTagsAndEntities({ tags: [], entities: [] });
                    const start: Date | undefined =
                      vals.start_datetime || vals.start_date || vals.date;

                    if (start) {
                      dispatch(
                        setEnforcedDate({
                          date: getDateStringFromDateObject(start)
                        })
                      );
                      dispatch(setLastUpdateId(String(new Date())));
                    }
                    navigation.goBack();
                  }}
                />
              )}
            </>
          )}
        </TransparentView>
      </TransparentView>
    </TransparentFullPageScrollView>
  );
}
