import { useNavigation } from '@react-navigation/native';
import { Button } from 'components/molecules/ButtonComponents';
import { Modal } from 'components/molecules/Modals';
import { PaddedSpinner } from 'components/molecules/Spinners';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import {
  useCreateRecurrentTaskOverwriteMutation,
  useUpdateRecurrentTaskAfterMutation
} from 'reduxStore/services/api/tasks';
import { selectScheduledTask } from 'reduxStore/slices/tasks/selectors';

const styles = StyleSheet.create({
  button: {
    marginBottom: 10
  }
});

export default function RecurrentUpdateModal({
  visible,
  onRequestClose,
  parsedFieldValues,
  recurrenceIndex,
  taskId
}: {
  visible: boolean;
  onRequestClose: () => void;
  parsedFieldValues: any;
  recurrenceIndex: number;
  taskId: number;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const [createRecurrentOverwrite, createRecurrentOverwriteResult] =
    useCreateRecurrentTaskOverwriteMutation();

  const [updateAfter, updateAfterResult] =
    useUpdateRecurrentTaskAfterMutation();

  const oldScheduledTask = useSelector(
    selectScheduledTask({ id: taskId, recurrenceIndex })
  );

  if (!oldScheduledTask) return null;

  const recurrence = oldScheduledTask.recurrence;

  if (!recurrence) return null;

  const isUpdating =
    createRecurrentOverwriteResult.isLoading || updateAfterResult.isLoading;

  return (
    <Modal visible={visible} onRequestClose={onRequestClose}>
      {isUpdating ? (
        <PaddedSpinner />
      ) : (
        <>
          <Button
            title={t('components.recurrentUpdateModal.updateOccurrence')}
            onPress={async () => {
              await createRecurrentOverwrite({
                task: parsedFieldValues,
                recurrence,
                recurrence_index: recurrenceIndex,
                baseTaskId: taskId
              }).unwrap();
              onRequestClose();
              navigation.goBack();
            }}
            style={styles.button}
          />
          <Button
            title={t('components.recurrentUpdateModal.updateAfter')}
            onPress={async () => {
              await updateAfter({
                task: parsedFieldValues,
                recurrence,
                recurrence_index: recurrenceIndex,
                baseTaskId: taskId,
                change_datetime:
                  oldScheduledTask?.start_datetime ||
                  oldScheduledTask?.start_date ||
                  oldScheduledTask?.date
              }).unwrap();
              onRequestClose();
              navigation.goBack();
            }}
          />
        </>
      )}
    </Modal>
  );
}
