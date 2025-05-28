import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  useCreateRecurrentTaskOverwriteMutation,
  useUpdateRecurrentTaskAfterMutation
} from 'reduxStore/services/api/tasks';
import { setTaskToAction } from 'reduxStore/slices/calendars/actions';
import { selectScheduledTask } from 'reduxStore/slices/tasks/selectors';
import { Button } from './ButtonComponents';
import { Modal } from './Modals';
import { PaddedSpinner } from './Spinners';

const styles = StyleSheet.create({
  button: {
    marginBottom: 10
  }
});

export default function DeleteTaskModal({
  visible,
  onRequestClose,
  recurrence,
  recurrenceIndex,
  taskId
}: {
  visible: boolean;
  onRequestClose: () => void;
  recurrence: number;
  recurrenceIndex: number;
  taskId: number;
}) {
  const { t } = useTranslation();
  const [createRecurrentOverwrite, createRecurrentOverwriteResult] =
    useCreateRecurrentTaskOverwriteMutation();

  const [updateAfter, updateAfterResult] =
    useUpdateRecurrentTaskAfterMutation();

  const dispatch = useDispatch();

  const task = useSelector(
    selectScheduledTask({
      id: taskId,
      recurrenceIndex: recurrenceIndex === -1 ? null : recurrenceIndex,
      actionId: null
    })
  );

  const isUpdating =
    createRecurrentOverwriteResult.isLoading || updateAfterResult.isLoading;

  return (
    <Modal visible={visible} onRequestClose={onRequestClose}>
      {isUpdating ? (
        <PaddedSpinner />
      ) : (
        <>
          <Button
            title={t('components.deleteTaskModal.deleteOccurrence')}
            onPress={async () => {
              await createRecurrentOverwrite({
                task: null,
                recurrence,
                recurrence_index: recurrenceIndex,
                baseTaskId: taskId
              }).unwrap();
              onRequestClose();
              dispatch(setTaskToAction(null));
            }}
            style={styles.button}
          />
          <Button
            title={t('components.deleteTaskModal.deleteAfter')}
            onPress={async () => {
              await updateAfter({
                task: null,
                recurrence,
                recurrence_index: recurrenceIndex,
                baseTaskId: taskId,
                change_datetime:
                  task?.start_datetime || task?.date || task?.start_date || ''
              }).unwrap();
              onRequestClose();
              dispatch(setTaskToAction(null));
            }}
          />
        </>
      )}
    </Modal>
  );
}
