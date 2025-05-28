import { useThemeColor } from 'components/Themed';
import { Button } from 'components/molecules/ButtonComponents';

import { useHolidayFieldTypes } from './taskFormFieldTypes';
import { useEffect, useMemo, useState } from 'react';

import { useTranslation } from 'react-i18next';
import { TransparentPaddedView } from 'components/molecules/ViewComponents';
import TypedForm from 'components/forms/TypedForm';
import createInitialObject from 'components/forms/utils/createInitialObject';
import { FieldValueTypes } from 'components/forms/types';
import { StyleSheet, ViewStyle } from 'react-native';
import { FullPageSpinner, PaddedSpinner } from 'components/molecules/Spinners';
import {
  useCreateTaskMutation,
  useCreateTaskWithoutCacheInvalidationMutation
} from 'reduxStore/services/api/tasks';
import parseFormValues from 'components/forms/utils/parseFormValues';
import useGetUserDetails from 'hooks/useGetUserDetails';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import hasAllRequired from 'components/forms/utils/hasAllRequired';
import { useSelector } from 'react-redux';
import { selectTaskById } from 'reduxStore/slices/tasks/selectors';
import { TransparentFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { Recurrence, Reminder } from 'types/tasks';
import RecurrentUpdateModal from './RecurrentUpdateModal';

const styles = StyleSheet.create({
  container: {
    paddingBottom: 100
  },
  bottomButtons: {
    flexDirection: 'row',
    width: '100%',
    zIndex: -1,
    justifyContent: 'center'
  },
  spinner: { marginTop: 20 },
  hidden: { display: 'none' },
  typeSelectorSection: { marginBottom: 50 }
});

type AddHolidayTaskFormProps = {
  onSuccess: () => void;
  recurrenceOverwrite?: boolean;
  recurrenceIndex?: number;
  taskId?: number;
  sectionStyle?: ViewStyle;
  inlineFields?: boolean;
  defaults: {
    title?: string;
    start_date?: string;
    end_date?: string;
    entities?: number[];
    members?: number[];
    tags?: string[];
    recurrence?: Recurrence | null;
    reminders?: Reminder[];
    actions?: { action_timedelta: string }[];
  };
};

export default function AddHolidayTaskForm({
  onSuccess,
  recurrenceOverwrite,
  recurrenceIndex,
  taskId,
  sectionStyle,
  inlineFields,
  defaults
}: AddHolidayTaskFormProps) {
  const { t } = useTranslation();
  const { data: userDetails } = useGetUserDetails();

  const [createTask, createTaskResult] = useCreateTaskMutation();
  const [createTaskWithoutCacheInvalidation, createTaskWithoutMutationResult] =
    useCreateTaskWithoutCacheInvalidationMutation();

  const taskObj = useSelector(selectTaskById(taskId || -1));

  const [showRecurrentUpdateModal, setShowRecurrentUpdateModal] =
    useState(false);

  const isSubmitting =
    createTaskResult.isLoading || createTaskWithoutMutationResult.isLoading;

  const fieldColor = useThemeColor({}, 'almostWhite');

  const [holidayTaskFieldValues, setHolidayFieldValues] =
    useState<FieldValueTypes>({});
  const [loadedFields, setLoadedFields] = useState<boolean>(false);
  const [resetState, setResetState] = useState<() => void>(() => () => {});

  const holidayFields = useHolidayFieldTypes(false);

  const [fieldValues, setFieldValues] = useState<any>({});

  const initialHolidayFields = useMemo(() => {
    if (!userDetails) {
      return null;
    }

    const defaultDueDate = new Date();
    defaultDueDate.setFullYear(defaultDueDate.getFullYear() - 1);
    const defaultRecurrence = {
      earliest_occurrence: null,
      latest_occurrence: null,
      interval_length: 1,
      recurrence: 'YEARLY'
    };

    return createInitialObject(holidayFields, userDetails, {
      start_date: defaults.start_date || defaultDueDate,
      end_date: defaults.end_date || defaultDueDate,
      title: defaults.title || '',
      tagsAndEntities: {
        entities: defaults.entities || [],
        tags: defaults.tags || ['SOCIAL_INTERESTS__HOLIDAY']
      },
      recurrence: defaults.recurrence || defaultRecurrence,
      actions: defaults.actions || [],
      members: defaults.members || []
    });
  }, [holidayFields, userDetails, defaults]);

  useEffect(() => {
    if (userDetails) {
      if (initialHolidayFields) {
        setHolidayFieldValues(initialHolidayFields);
      }

      if (initialHolidayFields) {
        setResetState(() => () => {
          setHolidayFieldValues(initialHolidayFields);
        });
      }

      setLoadedFields(true);
    }
  }, [initialHolidayFields, userDetails, holidayFields]);

  const hasRequired = useMemo(() => {
    return hasAllRequired(holidayTaskFieldValues, holidayFields);
  }, [holidayFields, holidayTaskFieldValues]);

  const submitForm = async () => {
    const parsedHolidayFieldValues = parseFormValues(
      holidayTaskFieldValues,
      holidayFields
    );
    const parsedFieldValues: any = {
      ...parsedHolidayFieldValues,
      // end_date: parsedDueDateFieldValues.start_date,
      type: 'HOLIDAY',
      resourcetype: 'HolidayTask'
    };

    setFieldValues(parsedFieldValues);

    try {
      if (recurrenceOverwrite) {
        setShowRecurrentUpdateModal(true);
      } else {
        if (
          parsedFieldValues.recurrence ||
          (parsedFieldValues.actions && parsedFieldValues.actions.length > 0)
        ) {
          await createTask(parsedFieldValues).unwrap();
        } else {
          await createTaskWithoutCacheInvalidation(parsedFieldValues).unwrap();
        }
        Toast.show({
          type: 'success',
          text1: t('screens.addTask.createSuccess')
        });
        resetState();
        onSuccess();
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('common.errors.generic')
      });
    }
  };

  const holidayTypedForm = useMemo(
    () => (
      <TypedForm
        fields={holidayFields}
        formValues={holidayTaskFieldValues}
        onFormValuesChange={(values: FieldValueTypes) => {
          setHolidayFieldValues(values);
        }}
        inlineFields={!!inlineFields}
        sectionStyle={sectionStyle}
        fieldColor={fieldColor}
      />
    ),
    [
      holidayFields,
      holidayTaskFieldValues,
      fieldColor,
      inlineFields,
      sectionStyle
    ]
  );

  if (!(userDetails && loadedFields)) {
    return <FullPageSpinner />;
  }

  return (
    <TransparentFullPageScrollView contentContainerStyle={styles.container}>
      {holidayTypedForm}
      {isSubmitting ? (
        <PaddedSpinner spinnerColor="buttonDefault" style={styles.spinner} />
      ) : (
        <TransparentPaddedView style={styles.bottomButtons}>
          <Button
            title={
              recurrenceOverwrite ? t('common.update') : t('common.create')
            }
            onPress={() => {
              submitForm();
            }}
            disabled={!hasRequired}
          />
        </TransparentPaddedView>
      )}
      <RecurrentUpdateModal
        visible={showRecurrentUpdateModal}
        onRequestClose={() => setShowRecurrentUpdateModal(false)}
        recurrenceIndex={recurrenceIndex === undefined ? -1 : recurrenceIndex}
        taskId={taskId || -1}
        parsedFieldValues={fieldValues}
      />
    </TransparentFullPageScrollView>
  );
}
