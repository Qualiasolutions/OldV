import { Button } from 'components/molecules/ButtonComponents';
import { TransparentScrollView } from 'components/molecules/ScrollViewComponents';
import { TransparentView } from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import { useFormType } from 'constants/TaskTypes';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import {
  selectScheduledTask,
  selectTaskById
} from 'reduxStore/slices/tasks/selectors';
import { elevation } from 'styles/elevation';

import GenericTaskForm from '../GenericTaskForm';
import createInitialObject from '../utils/createInitialObject';
import useGetUserDetails from 'hooks/useGetUserDetails';
import { useFieldTypesForTask } from '../taskFormFieldTypes';
import useDefaultTaskValues from 'hooks/useDefaultTaskValues';

const styles = StyleSheet.create({
  buttonWrapper: {
    flexDirection: 'row'
  },
  button: {
    margin: 10
  },
  modalFormContainer: { flexGrow: 0 }
});

export default function FinalOccurrenceRescheduler({
  onDismiss,
  onSubmitSuccess,
  taskId,
  recurrenceIndex
}: {
  onDismiss: () => void;
  onSubmitSuccess: () => void;
  taskId: number;
  recurrenceIndex?: number;
}) {
  const taskObj = useSelector(selectTaskById(taskId));
  const [rescheduling, setRescheduling] = useState(false);
  const { t } = useTranslation();

  const defaultLatestOccurrence = taskObj?.recurrence?.latest_occurrence
    ? new Date(taskObj.recurrence.latest_occurrence)
    : new Date();
  defaultLatestOccurrence.setMonth(defaultLatestOccurrence.getMonth() + 1);

  const defaultValues = useDefaultTaskValues(taskId, recurrenceIndex);

  if (!taskObj || !defaultValues) {
    return null;
  }

  if (rescheduling) {
    return (
      <TransparentScrollView style={styles.modalFormContainer}>
        <TransparentView>
          <GenericTaskForm
            type={taskObj.type}
            defaults={{
              ...defaultValues,
              recurrence: {
                ...defaultValues.recurrence,
                latest_occurrence: defaultLatestOccurrence
              },
              date_recurrence: {
                ...defaultValues.date_recurrence,
                latest_occurrence: defaultLatestOccurrence
              }
            }}
            onSuccess={onSubmitSuccess}
            sectionStyle={StyleSheet.flatten([
              elevation.unelevated,
              { marginBottom: 0 }
            ])}
          />
        </TransparentView>
      </TransparentScrollView>
    );
  }

  return (
    <TransparentView>
      <Text>
        {t(
          'components.taskCompletionModal.finalOccurrence.wouldYouLikeToExtend'
        )}
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
