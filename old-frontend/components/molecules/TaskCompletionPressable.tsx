import React, { useEffect } from 'react';
import useCompletionCallback from 'components/forms/TaskCompletionModal/taskCompletionCallbacks';
import TaskCompletionModal from 'components/forms/TaskCompletionModal/TaskCompletionModal';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useSelector } from 'react-redux';
import { StyleSheet } from 'react-native';
import {
  useCreateTaskActionCompletionFormMutation,
  useCreateTaskCompletionFormMutation
} from 'reduxStore/services/api/taskCompletionForms';
import { selectScheduledTask } from 'reduxStore/slices/tasks/selectors';
import SafePressable from './SafePressable';
import { TouchableOpacity } from './TouchableOpacityComponents';
import Checkbox, { CHECKBOX_HEIGHT, CHECKBOX_WIDTH } from './Checkbox';
import { SmallSpinner } from './Spinners';

const styles = StyleSheet.create({
  spinner: {
    width: CHECKBOX_WIDTH,
    height: CHECKBOX_HEIGHT,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default function TaskCompletionPressable({
  taskId,
  recurrenceIndex,
  actionId,
  onSuccess = () => {},
  onPress = () => {},
  children,
  useSafePressable = false,
  disabled
}: {
  taskId: number;
  recurrenceIndex?: number;
  actionId: number | null;
  onSuccess?: () => void;
  onPress?: () => void;
  children?: ReactNode;
  useSafePressable?: boolean;
  disabled?: boolean;
}) {
  const [showTaskCompletionForm, setShowTaskCompletionForm] = useState(false);
  const scheduledTask = useSelector(
    selectScheduledTask({ id: taskId, recurrenceIndex, actionId })
  );
  const isComplete = scheduledTask?.is_complete;
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);

  const [createTaskActionCompletionForm, createTaskActionCompletionFormResult] =
    useCreateTaskActionCompletionFormMutation();
  const [triggerCreateCompletionForm, createTaskCompletionFormResult] =
    useCreateTaskCompletionFormMutation();
  const completionCallback = useCompletionCallback(taskId, recurrenceIndex);

  useEffect(() => {
    setSubmitting(false);
  }, [scheduledTask?.is_complete]);

  if (!scheduledTask) {
    return null;
  }

  const PressableComp = useSafePressable ? SafePressable : TouchableOpacity;

  return (
    <>
      <PressableComp
        onPress={() => {
          if (disabled) return;
          if (createTaskActionCompletionFormResult.isLoading) return;
          if (createTaskCompletionFormResult.isLoading) return;
          onPress();
          setSubmitting(true);
          setTimeout(async () => {
            try {
              if (actionId) {
                if (isComplete) {
                  await createTaskActionCompletionForm({
                    action: actionId,
                    recurrence_index: scheduledTask.recurrence_index,
                    complete: false
                  }).unwrap();
                  onSuccess();
                  return;
                }
                await createTaskActionCompletionForm({
                  action: actionId,
                  recurrence_index: scheduledTask.recurrence_index
                }).unwrap();
                onSuccess();
                return;
              }
              if (isComplete) {
                await triggerCreateCompletionForm({
                  task: scheduledTask.id,
                  recurrence_index: scheduledTask.recurrence_index,
                  complete: false
                }).unwrap();
                onSuccess();
                return;
              }
              await triggerCreateCompletionForm({
                recurrence_index: scheduledTask.recurrence_index,
                task: scheduledTask.id
              }).unwrap();

              if (completionCallback) {
                setShowTaskCompletionForm(true);
              } else {
                onSuccess();
              }
            } catch (err) {
              Toast.show({
                type: 'error',
                text1: t('common.errors.generic')
              });
            } finally {
              setSubmitting(false);
            }
          }, 10);
        }}
      >
        {submitting ? (
          <SmallSpinner style={styles.spinner} />
        ) : (
          children || (
            <Checkbox
              checked={scheduledTask.is_complete}
              disabled={true}
              smoothChecking={false}
            />
          )
        )}
      </PressableComp>
      {scheduledTask && (
        <TaskCompletionModal
          taskId={taskId}
          recurrenceIndex={recurrenceIndex}
          onSubmitSuccess={() => {
            setShowTaskCompletionForm(false);
            onSuccess();
          }}
          onRequestClose={() => {
            setShowTaskCompletionForm(false);
          }}
          visible={showTaskCompletionForm}
        />
      )}
    </>
  );
}
