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
import {
  useCreateRecurrentTaskOverwriteMutation,
  useUpdateTaskWithoutCacheInvalidationMutation
} from 'reduxStore/services/api/tasks';
import { setTaskToReschedule } from 'reduxStore/slices/calendars/actions';
import { selectTaskToReschedule } from 'reduxStore/slices/calendars/selectors';
import { selectScheduledTask } from 'reduxStore/slices/tasks/selectors';
import { FixedTaskResponseType } from 'types/tasks';

const styles = StyleSheet.create({
  specificTimeSection: { marginTop: 20 },
  submitButton: { marginTop: 6 }
});

export default function TaskRescheduleModal() {
  const taskToReschedule = useSelector(selectTaskToReschedule);
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const scheduledTask = useSelector(
    selectScheduledTask({
      id: taskToReschedule?.taskId,
      recurrenceIndex: taskToReschedule?.recurrenceIndex
    })
  );
  const [newTaskTime, setNewTaskTime] = useState<Date | null>(null);
  // const [createTask, createTaskResult] =
  //   useCreateTaskWithoutCacheInvalidationMutation();
  // const [createTaskCompletionForm, createTaskCompletionFormResult] =
  //   useCreateTaskCompletionFormMutation();

  const [updateTask, updateTaskResult] =
    useUpdateTaskWithoutCacheInvalidationMutation();
  const [createRecurrentOverwrite, createRecurrentOverwriteResult] =
    useCreateRecurrentTaskOverwriteMutation();

  useEffect(() => {
    const scheduledTaskStart =
      scheduledTask?.start_date ||
      scheduledTask?.start_datetime ||
      scheduledTask?.date;
    setNewTaskTime(scheduledTaskStart ? new Date(scheduledTaskStart) : null);
  }, [scheduledTask]);

  const rescheduleTask = useCallback(
    async ({ daysOffset, start }: { daysOffset?: number; start?: Date }) => {
      if (scheduledTask) {
        const updateBody: Partial<FixedTaskResponseType> &
          Pick<FixedTaskResponseType, 'id'> = {
          id: scheduledTask.id
        };
        if (scheduledTask.start_datetime && scheduledTask.end_datetime) {
          if (daysOffset) {
            const startDatetime = new Date(scheduledTask.start_datetime);
            startDatetime.setDate(startDatetime.getDate() + daysOffset);
            updateBody.start_datetime = startDatetime.toISOString();

            const endDatetime = new Date(scheduledTask.end_datetime);
            endDatetime.setDate(endDatetime.getDate() + daysOffset);
            updateBody.end_datetime = endDatetime.toISOString();
          } else if (start) {
            const startDatetime = new Date(start);

            const duration =
              Number(new Date(scheduledTask.end_datetime)) -
              Number(new Date(scheduledTask.start_datetime));
            const endDatetime = new Date(Number(startDatetime) + duration);

            updateBody.start_datetime = startDatetime.toISOString();
            updateBody.end_datetime = endDatetime.toISOString();
          }
        }
        if (scheduledTask.start_date && scheduledTask.end_date) {
          if (daysOffset) {
            const startDate = new Date(scheduledTask.start_date);
            startDate.setDate(startDate.getDate() + daysOffset);
            updateBody.start_date = dayjs(startDate).format('YYYY-MM-DD');

            const endDate = new Date(scheduledTask.end_date);
            endDate.setDate(endDate.getDate() + daysOffset);
            updateBody.end_date = dayjs(endDate).format('YYYY-MM-DD');
          } else if (start) {
            const startDate = new Date(start);
            const duration =
              Number(new Date(scheduledTask.end_date)) -
              Number(new Date(scheduledTask.start_date));
            const endDate = new Date(Number(startDate) + duration);
            updateBody.start_date = dayjs(startDate).format('YYYY-MM-DD');
            updateBody.end_date = dayjs(endDate).format('YYYY-MM-DD');
          }
        }
        if (scheduledTask.date && scheduledTask.duration) {
          if (daysOffset) {
            const newDate = new Date(scheduledTask.date);
            newDate.setDate(newDate.getDate() + daysOffset);
            updateBody.date = dayjs(newDate).format('YYYY-MM-DD');
            updateBody.duration = scheduledTask.duration;
          } else if (start) {
            const newDate = new Date(start);
            updateBody.date = dayjs(newDate).format('YYYY-MM-DD');
            updateBody.duration = scheduledTask.duration;
          }
        }

        try {
          dispatch(setTaskToReschedule(null));
          if (
            taskToReschedule?.recurrenceIndex !== null &&
            taskToReschedule?.recurrenceIndex !== undefined &&
            scheduledTask.recurrence
          ) {
            createRecurrentOverwrite({
              task: {
                title: scheduledTask.title,
                members: scheduledTask.members,
                entities: scheduledTask.entities,
                resourcetype: 'FixedTask',
                ...updateBody
              },
              recurrence: scheduledTask.recurrence,
              recurrence_index: taskToReschedule?.recurrenceIndex,
              baseTaskId: taskToReschedule.taskId
            });
          } else {
            await updateTask(updateBody).unwrap();
          }
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
      dispatch,
      t,
      updateTask,
      createRecurrentOverwrite,
      taskToReschedule
    ]
  );

  return (
    <Modal
      visible={!!taskToReschedule}
      onRequestClose={() => {
        dispatch(setTaskToReschedule(null));
      }}
    >
      <TransparentView>
        <LinkButton
          title={t('components.taskRescheduleModal.rescheduleOneDay')}
          disabled={
            updateTaskResult.isLoading ||
            createRecurrentOverwriteResult.isLoading
          }
          onPress={() => {
            rescheduleTask({ daysOffset: 1 });
          }}
        />
        <LinkButton
          title={t('components.taskRescheduleModal.rescheduleOneWeek')}
          onPress={() => {
            rescheduleTask({ daysOffset: 7 });
          }}
        />

        <TransparentView style={styles.specificTimeSection}>
          <Text>{t('components.taskRescheduleModal.rescheduleOn')}</Text>
          <DateTimeTextInput
            value={newTaskTime}
            onValueChange={setNewTaskTime}
            mode={scheduledTask?.start_datetime ? 'datetime' : 'date'}
          />
          <SmallButton
            title={t('common.submit')}
            onPress={() => {
              if (newTaskTime) {
                rescheduleTask({ start: newTaskTime });
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
