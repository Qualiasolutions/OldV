import { Text } from 'components/Themed';
import { useEffect, useMemo, useState } from 'react';
import { selectTaskById } from 'reduxStore/slices/tasks/selectors';
import { useSelector } from 'react-redux';
import TypedForm from '../TypedForm';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { FieldValueTypes } from '../types';
import { StyleSheet } from 'react-native';
import { elevation } from 'styles/elevation';
import { Button } from 'components/molecules/ButtonComponents';
import SafePressable from 'components/molecules/SafePressable';
import { PrimaryText } from 'components/molecules/TextComponents';
import { TransparentView } from 'components/molecules/ViewComponents';
import { TransparentScrollView } from 'components/molecules/ScrollViewComponents';
import parseFormValues from '../utils/parseFormValues';
import hasAllRequired from '../utils/hasAllRequired';
import { PaddedSpinner } from 'components/molecules/Spinners';
import { useTranslation } from 'react-i18next';
import reminderDropDownField from '../entityFormFieldTypes/utils/reminderDropDownField';
import dueDateMembershipField from '../entityFormFieldTypes/utils/dueDateMembershipField';
import { useCreateTaskMutation } from 'reduxStore/services/api/tasks';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import createInitialObject from '../utils/createInitialObject';

const styles = StyleSheet.create({
  buttons: { alignItems: 'flex-end' },
  skipButton: { marginTop: 5 },
  modalFormContainer: { flexGrow: 0 }
});

export default function MOTTypeRescheduler({
  taskId,
  onSubmitSuccess,
  onDismiss
}: {
  taskId: number;
  onSubmitSuccess: () => void;
  onDismiss: () => void;
}) {
  const taskObj = useSelector(selectTaskById(taskId));
  const [fieldValues, setFieldValues] = useState<FieldValueTypes>({});

  const { t } = useTranslation();
  const { t: modelFieldTranslations } = useTranslation('modelFields');

  const { data: userFullDetails } = useGetUserFullDetails();

  const [createTask, createTaskResult] = useCreateTaskMutation();

  const completionFields = useMemo<FieldValueTypes>(() => {
    if (userFullDetails) {
      return {
        date: {
          type: 'Date',
          required: true,
          displayName: modelFieldTranslations('tasks.task.date')
        },
        reminder_interval: reminderDropDownField(
          'date',
          modelFieldTranslations('entities.entity.reminder'),
          false
        ),
        members: dueDateMembershipField(
          'date',
          false,
          modelFieldTranslations('entities.entity.taskMembers'),
          modelFieldTranslations('tasks.task.changeMembers')
        )
      };
    }
    return {};
  }, [modelFieldTranslations, userFullDetails]);

  const initialFieldValues = useMemo(() => {
    if (userFullDetails && completionFields && taskObj) {
      const initialFields: { [key: string]: any } = {
        ...taskObj,
        tagsAndEntities: { entities: taskObj.entities, tags: taskObj.tags }
      };
      if (taskObj.date) {
        const nextYear = new Date(taskObj.date);
        nextYear.setFullYear(nextYear.getFullYear() + 1);
        initialFields.date = nextYear;
      }
      return createInitialObject(
        completionFields,
        userFullDetails,
        initialFields
      );
    }
    return {};
  }, [userFullDetails, completionFields, taskObj]);

  useEffect(() => {
    if (initialFieldValues) {
      setFieldValues(initialFieldValues);
    }
  }, [initialFieldValues]);

  if (!userFullDetails || !taskObj) {
    return null;
  }

  const allRequired = completionFields
    ? hasAllRequired(fieldValues, completionFields)
    : false;

  const title = t('components.task.scheduleNext', {
    dueDateType: taskObj.hidden_tag ? t(`hiddenTags.${taskObj.hidden_tag}`) : ''
  });

  return (
    <TransparentScrollView style={styles.modalFormContainer}>
      <TransparentView>
        {title ? <Text>{title}</Text> : null}
        <TypedForm
          fields={completionFields}
          formValues={fieldValues}
          onFormValuesChange={(values: FieldValueTypes) =>
            setFieldValues(values)
          }
          sectionStyle={StyleSheet.flatten([
            {
              backgroundColor: 'transparent',
              marginBottom: 0,
              paddingHorizontal: 0
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
                const parsedFormValues = parseFormValues(
                  fieldValues,
                  completionFields
                );
                try {
                  const timeDeltaMapping: { [key: string]: string } = {
                    DAILY: '1 day, 00:00:00',
                    WEEKLY: '7 days, 00:00:00',
                    MONTHLY: '30 days, 00:00:00'
                  };
                  await createTask({
                    hidden_tag: taskObj.hidden_tag,
                    resourcetype: 'FixedTask',
                    date: parsedFormValues.date,
                    duration: 30,
                    members: parsedFormValues.members,
                    title: t('components.entityPages.car.dueDateTitle', {
                      dueDateType: t(`hiddenTags.${taskObj.hidden_tag}`)
                    }),
                    actions: parsedFormValues.reminder_interval
                      ? [
                          {
                            action_timedelta:
                              timeDeltaMapping[
                                parsedFormValues.reminder_interval
                              ]
                          }
                        ]
                      : [],
                    entities: taskObj.entities,
                    type: 'DUE_DATE'
                  }).unwrap();
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
            <TransparentView style={styles.buttons}>
              <SafePressable style={styles.skipButton} onPress={onDismiss}>
                <PrimaryText text={t('common.skip')} />
              </SafePressable>
            </TransparentView>
          </>
        )}
      </TransparentView>
    </TransparentScrollView>
  );
}
