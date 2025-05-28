import { Button } from 'components/molecules/ButtonComponents';
import { TransparentScrollView } from 'components/molecules/ScrollViewComponents';
import { PaddedSpinner } from 'components/molecules/Spinners';
import { TransparentView } from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useSelector } from 'react-redux';
import { useCreateTaskMutation } from 'reduxStore/services/api/tasks';
import { selectTaskById } from 'reduxStore/slices/tasks/selectors';
import { elevation } from 'styles/elevation';
import { useDueDateFieldTypes } from '../taskFormFieldTypes';
import TypedForm from '../TypedForm';
import { FieldValueTypes } from '../types';
import createInitialObject from '../utils/createInitialObject';
import hasAllRequired from '../utils/hasAllRequired';
import parseFormValues from '../utils/parseFormValues';

const styles = StyleSheet.create({
  buttonWrapper: {
    flexDirection: 'row'
  },
  button: {
    margin: 10
  },
  modalFormContainer: { flexGrow: 0 }
});
export default function DueDateRescheduler({
  onDismiss,
  onSubmitSuccess,
  taskId
}: {
  onDismiss: () => void;
  onSubmitSuccess: () => void;
  taskId: number;
}) {
  const taskObj = useSelector(selectTaskById(taskId));
  const [rescheduling, setRescheduling] = useState(false);
  const { t } = useTranslation();
  const dueDateFields = useDueDateFieldTypes({});
  const [fieldValues, setFieldValues] = useState<FieldValueTypes>({});
  const [createTask, createTaskResult] = useCreateTaskMutation();
  const { data: userFullDetails } = useGetUserFullDetails();

  const allRequired = dueDateFields
    ? hasAllRequired(fieldValues, dueDateFields)
    : false;

  const submitForm = async () => {
    const parsedFormValues = parseFormValues(fieldValues, dueDateFields);
    const body: any = {
      resourcetype: 'FixedTask',
      type: 'DUE_DATE',
      ...parsedFormValues
    };
    await createTask(body).unwrap();
  };

  const initialFieldValues = useMemo(() => {
    if (userFullDetails && dueDateFields && taskObj) {
      const initialFields: { [key: string]: any } = {
        ...taskObj,
        tagsAndEntities: { entities: taskObj.entities, tags: taskObj.tags }
      };
      if (taskObj.date) {
        const nextMonth = new Date(taskObj.date);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        initialFields.date = nextMonth;
      }
      return createInitialObject(dueDateFields, userFullDetails, initialFields);
    }
    return {};
  }, [dueDateFields, taskObj, userFullDetails]);

  useEffect(() => {
    if (initialFieldValues) {
      setFieldValues(initialFieldValues);
    }
  }, [initialFieldValues]);

  if (rescheduling) {
    return (
      <TransparentScrollView style={styles.modalFormContainer}>
        <TransparentView>
          <TypedForm
            fields={dueDateFields}
            formValues={fieldValues}
            onFormValuesChange={(values: FieldValueTypes) =>
              setFieldValues(values)
            }
            sectionStyle={StyleSheet.flatten([
              {
                backgroundColor: 'transparent',
                marginBottom: 0,
                minWidth: '90%'
              },
              elevation.unelevated
            ])}
          />
          {createTaskResult.isLoading ? (
            <PaddedSpinner />
          ) : (
            <>
              <Button
                title={t('common.submit')}
                onPress={async () => {
                  try {
                    await submitForm();
                    onSubmitSuccess();
                  } catch {
                    Toast.show({
                      type: 'error',
                      text1: t('common.errors.generic')
                    });
                  }
                }}
                disabled={!allRequired}
              />
            </>
          )}
        </TransparentView>
      </TransparentScrollView>
    );
  }

  return (
    <TransparentView>
      <Text>
        {t('components.taskCompletionModal.dueDate.wouldYouLikeToReschedule')}
      </Text>
      <TransparentView style={styles.buttonWrapper}>
        <Button
          onPress={() => setRescheduling(true)}
          title={t('common.yes')}
          style={styles.button}
        />
        <Button
          onPress={onDismiss}
          title={t('common.no')}
          style={styles.button}
        />
      </TransparentView>
    </TransparentView>
  );
}
