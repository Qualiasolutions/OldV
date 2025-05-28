import DateTimeTextInput from 'components/forms/components/DateTimeTextInput';
import { LinkButton, SmallButton } from 'components/molecules/ButtonComponents';
import { Modal } from 'components/molecules/Modals';
import { TransparentView } from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import dayjs from 'dayjs';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useDispatch, useSelector } from 'react-redux';
import { useCreateTaskCompletionFormMutation } from 'reduxStore/services/api/taskCompletionForms';
import { useCreateTaskWithoutCacheInvalidationMutation } from 'reduxStore/services/api/tasks';
import { setTaskToPartiallyComplete } from 'reduxStore/slices/calendars/actions';
import { selectTaskToPartiallyComplete } from 'reduxStore/slices/calendars/selectors';
import { selectScheduledTask } from 'reduxStore/slices/tasks/selectors';
import { CreateTaskRequest } from 'types/tasks';

const styles = StyleSheet.create({
  specificTimeSection: { marginTop: 20 },
  submitButton: { marginTop: 6 }
});

export default function TaskPartialCompletionModal() {
  const taskToPartiallyComplete = useSelector(selectTaskToPartiallyComplete);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const scheduledTask = useSelector(
    selectScheduledTask({
      id: taskToPartiallyComplete?.taskId,
      recurrenceIndex: taskToPartiallyComplete?.recurrenceIndex
    })
  );
  const [newTaskTime, setNewTaskTime] = useState<Date | null>(null);
  const [createTask, createTaskResult] =
    useCreateTaskWithoutCacheInvalidationMutation();
  const [createTaskCompletionForm, createTaskCompletionFormResult] =
    useCreateTaskCompletionFormMutation();

  useEffect(() => {
    const scheduledTaskStart =
      scheduledTask?.start_date ||
      scheduledTask?.start_datetime ||
      scheduledTask?.date;
    setNewTaskTime(scheduledTaskStart ? new Date(scheduledTaskStart) : null);
  }, [scheduledTask]);

  const createDuplicateTask = useCallback(
    async ({ daysOffset, start }: { daysOffset?: number; start?: Date }) => {
      if (scheduledTask) {
        const newTaskCreateBody: CreateTaskRequest = {
          title: scheduledTask.title,
          members: scheduledTask.members,
          entities: scheduledTask.entities,
          resourcetype: 'FixedTask'
        };
        if (scheduledTask.start_datetime && scheduledTask.end_datetime) {
          if (daysOffset) {
            const startDatetime = new Date(scheduledTask.start_datetime);
            startDatetime.setDate(startDatetime.getDate() + daysOffset);
            newTaskCreateBody.start_datetime = startDatetime.toISOString();

            const endDatetime = new Date(scheduledTask.end_datetime);
            endDatetime.setDate(endDatetime.getDate() + daysOffset);
            newTaskCreateBody.end_datetime = endDatetime.toISOString();
          } else if (start) {
            const startDatetime = new Date(start);

            const duration =
              Number(new Date(scheduledTask.end_datetime)) -
              Number(new Date(scheduledTask.start_datetime));
            const endDatetime = new Date(Number(startDatetime) + duration);

            newTaskCreateBody.start_datetime = startDatetime.toISOString();
            newTaskCreateBody.end_datetime = endDatetime.toISOString();
          }
        }
        if (scheduledTask.start_date && scheduledTask.end_date) {
          if (daysOffset) {
            const startDate = new Date(scheduledTask.start_date);
            startDate.setDate(startDate.getDate() + daysOffset);
            newTaskCreateBody.start_date =
              dayjs(startDate).format('YYYY-MM-DD');

            const endDate = new Date(scheduledTask.end_date);
            endDate.setDate(endDate.getDate() + daysOffset);
            newTaskCreateBody.end_date = dayjs(endDate).format('YYYY-MM-DD');
          } else if (start) {
            const startDate = new Date(start);
            const duration =
              Number(new Date(scheduledTask.end_date)) -
              Number(new Date(scheduledTask.start_date));
            const endDate = new Date(Number(startDate) + duration);
            newTaskCreateBody.start_date =
              dayjs(startDate).format('YYYY-MM-DD');
            newTaskCreateBody.end_date = dayjs(endDate).format('YYYY-MM-DD');
          }
        }
        if (scheduledTask.date && scheduledTask.duration) {
          if (daysOffset) {
            const newDate = new Date(scheduledTask.date);
            newDate.setDate(newDate.getDate() + daysOffset);
            newTaskCreateBody.date = dayjs(newDate).format('YYYY-MM-DD');
            newTaskCreateBody.duration = scheduledTask.duration;
          } else if (start) {
            const newDate = new Date(start);
            newTaskCreateBody.date = dayjs(newDate).format('YYYY-MM-DD');
            newTaskCreateBody.duration = scheduledTask.duration;
          }
        }

        try {
          dispatch(setTaskToPartiallyComplete(null));
          await Promise.all([
            createTask(newTaskCreateBody).unwrap(),
            createTaskCompletionForm({
              task: scheduledTask.id,
              recurrence_index:
                taskToPartiallyComplete?.recurrenceIndex === undefined
                  ? -1
                  : taskToPartiallyComplete?.recurrenceIndex,
              complete: true,
              partial: true
            }).unwrap()
          ]);
        } catch {
          Toast.show({
            type: 'error',
            text1: t('common.errors.generic')
          });
        }
      }
    },
    [
      scheduledTask,
      createTask,
      dispatch,
      t,
      createTaskCompletionForm,
      taskToPartiallyComplete
    ]
  );

  return (
    <Modal
      visible={!!taskToPartiallyComplete}
      onRequestClose={() => {
        dispatch(setTaskToPartiallyComplete(null));
      }}
    >
      <TransparentView>
        <LinkButton
          title={t('components.taskPartialCompletionModal.rescheduleOneDay')}
          disabled={
            createTaskResult.isLoading ||
            createTaskCompletionFormResult.isLoading
          }
          onPress={() => {
            createDuplicateTask({ daysOffset: 1 });
          }}
        />
        <LinkButton
          title={t('components.taskPartialCompletionModal.rescheduleOneWeek')}
          onPress={() => {
            createDuplicateTask({ daysOffset: 7 });
          }}
        />

        <TransparentView style={styles.specificTimeSection}>
          <Text>{t('components.taskPartialCompletionModal.rescheduleOn')}</Text>
          <DateTimeTextInput
            value={newTaskTime}
            onValueChange={setNewTaskTime}
            mode={scheduledTask?.start_datetime ? 'datetime' : 'date'}
          />
          <SmallButton
            title={t('common.submit')}
            onPress={() => {
              if (newTaskTime) {
                createDuplicateTask({ start: newTaskTime });
              }
            }}
            disabled={!newTaskTime}
            style={styles.submitButton}
          />
        </TransparentView>
      </TransparentView>
    </Modal>
  );
}
