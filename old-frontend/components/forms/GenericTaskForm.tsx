import { useIsFocused } from '@react-navigation/native';
import { Button } from 'components/molecules/ButtonComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { useThemeColor } from 'components/Themed';
import {
  isAccommodationTaskType,
  isActivityTaskType,
  isAnniversaryTaskType,
  isTransportTaskType
} from 'constants/TaskTypes';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, ViewStyle } from 'react-native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import {
  useCreateFlexibleFixedTaskMutation,
  useCreateTaskMutation,
  useCreateTaskWithoutCacheInvalidationMutation,
  useUpdateTaskMutation
} from 'reduxStore/services/api/tasks';
import { FixedTaskResponseType, TaskType } from 'types/tasks';
import RecurrentUpdateModal from './RecurrentUpdateModal';
import { useFieldTypesForFormType } from './taskFormFieldTypes';
import TypedForm from './TypedForm';
import { FieldValueTypes } from './types';
import hasAllRequired from './utils/hasAllRequired';
import parseFormValues from './utils/parseFormValues';

const styles = StyleSheet.create({
  bottomButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center'
  }
});

export default function GenericTaskForm({
  type,
  defaults,
  onSuccess,
  recurrenceOverwrite,
  recurrenceIndex,
  isEdit,
  taskId,
  inlineFields = true,
  sectionStyle,
  extraFields
}: {
  type: TaskType;
  defaults: any;
  onSuccess?: (vals: FieldValueTypes) => void;
  recurrenceOverwrite?: boolean;
  recurrenceIndex?: number;
  isEdit?: boolean;
  taskId?: number;
  inlineFields?: boolean;
  sectionStyle?: ViewStyle;
  extraFields?: { [key: string]: any };
}) {
  /*
    GenericTaskForm

    Use recurrenceOverwrite, recurrenceIndex and taskId to use this
    to overwrite a recurrent task (either the instance or the series)

    Otherwise this is just a standard AddTask form
  */

  const [taskFieldValues, setTaskFieldValues] = useState<FieldValueTypes>({});
  const [showRecurrentUpdateModal, setShowRecurrentUpdateModal] =
    useState(false);
  const [stateParsedFieldValues, setStateParsedFieldValues] = useState({});
  const fieldColor = useThemeColor({}, 'almostWhite');
  const { t } = useTranslation();

  const [createTask, createTaskResult] = useCreateTaskMutation();
  const [createFlexibleTask, createFlexibleTaskResult] =
    useCreateFlexibleFixedTaskMutation();
  const [createTaskWithoutCacheInvalidation, createTaskWithoutMutationResult] =
    useCreateTaskWithoutCacheInvalidationMutation();
  const [updateTask, updateTaskResult] = useUpdateTaskMutation();

  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused) {
      setTaskFieldValues({});
    }
  }, [isFocused]);

  useEffect(() => {
    if (isFocused) {
      if (isEdit) {
        // If edit then we want to make sure that we start with
        // the right form values that are passed in from the parent
        return setTaskFieldValues({ ...defaults });
      }

      // Otherwise we want to retain the current values
      // except for specific fields
      setTaskFieldValues((v) => ({
        ...defaults,
        ...v,
        recurrence: defaults.recurrence // Always just use the defaulted recurrence
      }));
    }
  }, [defaults, type, isEdit, isFocused]);

  const isSubmitting =
    createTaskResult.isLoading ||
    createTaskWithoutMutationResult.isLoading ||
    createFlexibleTaskResult.isLoading ||
    updateTaskResult.isLoading;

  const formType = useMemo(() => {
    if (!type) {
      return null;
    }
    if (isTransportTaskType(type)) {
      return 'TRANSPORT';
    }
    if (isAccommodationTaskType(type)) {
      return 'ACCOMMODATION';
    }
    if (isAnniversaryTaskType(type)) {
      return 'ANNIVERSARY';
    }
    if (isActivityTaskType(type)) {
      return 'ACTIVITY';
    }
    return type;
  }, [type]);

  const disabledRecurrenceFields =
    isEdit &&
    (isAnniversaryTaskType(type) ||
      type === 'USER_BIRTHDAY' ||
      (recurrenceIndex !== undefined && !recurrenceOverwrite));

  const formFields = useFieldTypesForFormType(
    formType === 'ICAL_EVENT' ? null : formType,
    {
      isEdit,
      disabledRecurrenceFields,
      disableFlexible: recurrenceIndex !== undefined,
      anniversaryType: isAnniversaryTaskType(type) ? type : undefined,
      transportType: isTransportTaskType(type) ? type : undefined,
      accommodationType: isAccommodationTaskType(type) ? type : undefined
    }
  );

  const hasRequired = useMemo(() => {
    return hasAllRequired(taskFieldValues, formFields);
  }, [formFields, taskFieldValues]);

  const getParsedFieldValues = useCallback(() => {
    const resourceTypeMapping = {
      TASK: 'FixedTask',
      ACTIVITY: 'FixedTask',
      APPOINTMENT: 'FixedTask',
      DUE_DATE: 'FixedTask',
      TRANSPORT: 'TransportTask',
      ACCOMMODATION: 'AccommodationTask',
      ANNIVERSARY: 'AnniversaryTask',
      USER_BIRTHDAY: 'FixedTask',
      HOLIDAY: 'HolidayTask',
      '': 'FixedTask'
    };

    const parsedFormFieldValues = parseFormValues(taskFieldValues, formFields);
    const parsedFullFieldValues: any = {
      ...parsedFormFieldValues,
      type: type,
      resourcetype:
        formType === 'ANNIVERSARY' && type === 'BIRTHDAY'
          ? 'BirthdayTask'
          : resourceTypeMapping[formType === 'ICAL_EVENT' ? '' : formType || '']
    };

    if (parsedFormFieldValues.date && !parsedFormFieldValues.duration) {
      if (!parsedFormFieldValues.start_date) {
        parsedFullFieldValues.start_date = parsedFormFieldValues.date;
      }
      if (!parsedFormFieldValues.end_date) {
        parsedFullFieldValues.end_date = parsedFullFieldValues.start_date;
      }

      delete parsedFullFieldValues.date;
    }

    if (disabledRecurrenceFields) {
      delete parsedFullFieldValues.recurrence;
    }

    return {
      ...parsedFullFieldValues,
      ...(extraFields || {})
    };
  }, [
    formFields,
    formType,
    taskFieldValues,
    type,
    extraFields,
    disabledRecurrenceFields
  ]);

  const submitCreateForm = async () => {
    const parsedFullFieldValues = getParsedFieldValues();

    try {
      if (taskFieldValues.is_flexible) {
        await createFlexibleTask(parsedFullFieldValues).unwrap();
      } else {
        if (
          parsedFullFieldValues.recurrence ||
          (parsedFullFieldValues.actions &&
            parsedFullFieldValues.actions.length > 0)
        ) {
          await createTask(parsedFullFieldValues).unwrap();
        } else {
          await createTaskWithoutCacheInvalidation(
            parsedFullFieldValues
          ).unwrap();
        }
      }
      Toast.show({
        type: 'success',
        text1: t('screens.addTask.createSuccess')
      });
      if (onSuccess) {
        onSuccess(taskFieldValues);
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: t('common.errors.generic')
      });
    }
  };

  const updateTaskAndCallbacks = useCallback(
    async (
      body: Partial<FixedTaskResponseType> & Pick<FixedTaskResponseType, 'id'>
    ) => {
      try {
        await updateTask(body).unwrap();
        Toast.show({
          type: 'success',
          text1: t('screens.editTask.updateSuccess')
        });
        if (onSuccess) {
          onSuccess(taskFieldValues);
        }
      } catch (e) {
        Toast.show({
          type: 'error',
          text1: t('common.errors.generic')
        });
      }
    },
    [t, updateTask, onSuccess, taskFieldValues]
  );

  const onChangeValues = useCallback(
    (vals: FieldValueTypes) => {
      const newVals = { ...vals };
      if (
        taskFieldValues.start_datetime !== vals.start_datetime ||
        taskFieldValues.end_datetime !== vals.end_datetime
      ) {
        newVals.start_date = vals.start_datetime;
        newVals.end_date = vals.end_datetime;
        newVals.date = vals.start_datetime;
        newVals.due_date = vals.start_datetime;
      }

      if (
        taskFieldValues.start_date !== vals.start_date ||
        taskFieldValues.end_date !== vals.end_date
      ) {
        newVals.start_datetime = vals.start_date;
        newVals.end_datetime = vals.end_date;
        newVals.date = vals.start_date;
        newVals.due_date = vals.start_date;
      }

      if (taskFieldValues.date !== vals.date) {
        newVals.start_datetime = vals.date;
        newVals.end_datetime = vals.date;
        newVals.start_date = vals.date;
        newVals.end_date = vals.date;
        newVals.due_date = vals.date;
      }

      setTaskFieldValues(newVals);
    },
    [taskFieldValues]
  );

  const submitUpdateForm = () => {
    if (taskId) {
      const parsedTaskFieldValues = getParsedFieldValues();

      const body = {
        ...parsedTaskFieldValues,
        resourcetype: 'FixedTask' as 'FixedTask',
        type,
        id: taskId
      };

      if (recurrenceIndex !== undefined) {
        delete body.recurrence;
      }

      updateTaskAndCallbacks(body);
    }
  };

  if (!formType) {
    return null;
  }

  if (Object.keys(taskFieldValues).length === 0) {
    return null;
  }

  return (
    <>
      <TypedForm
        fields={formFields}
        formValues={taskFieldValues}
        onFormValuesChange={onChangeValues}
        inlineFields={inlineFields}
        fieldColor={fieldColor}
        sectionStyle={sectionStyle}
      />
      {formType !== 'USER_BIRTHDAY' && (
        <TransparentPaddedView style={styles.bottomButtons}>
          {isSubmitting ? (
            <PaddedSpinner spinnerColor="buttonDefault" />
          ) : isEdit ? (
            recurrenceOverwrite ? (
              <Button
                title={t('common.update')}
                onPress={() => {
                  const parsedTaskFieldValues = getParsedFieldValues();
                  setStateParsedFieldValues(parsedTaskFieldValues);
                  setShowRecurrentUpdateModal(true);
                }}
                disabled={!hasRequired}
              />
            ) : (
              <TransparentView>
                <Button
                  title={t('common.update')}
                  onPress={() => {
                    submitUpdateForm();
                  }}
                  disabled={!hasRequired}
                />
              </TransparentView>
            )
          ) : (
            <Button
              title={t('common.create')}
              onPress={() => {
                submitCreateForm();
              }}
              disabled={!hasRequired}
            />
          )}
        </TransparentPaddedView>
      )}
      <RecurrentUpdateModal
        visible={showRecurrentUpdateModal}
        onRequestClose={() => setShowRecurrentUpdateModal(false)}
        recurrenceIndex={recurrenceIndex === undefined ? -1 : recurrenceIndex}
        taskId={taskId || -1}
        parsedFieldValues={stateParsedFieldValues}
      />
    </>
  );
}
