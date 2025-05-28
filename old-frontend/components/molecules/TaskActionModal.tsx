import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { selectTaskToAction } from 'reduxStore/slices/calendars/selectors';
import { RootTabParamList } from 'types/base';
import { LinkButton } from './ButtonComponents';
import { Modal } from 'components/molecules/Modals';

import {
  setTaskToAction,
  setTaskToPartiallyComplete,
  setTaskToReschedule
} from 'reduxStore/slices/calendars/actions';
import {
  selectOverdueTasks,
  selectScheduledTask,
  selectTaskById
} from 'reduxStore/slices/tasks/selectors';

import DeleteTaskModal from './DeleteTaskModal';
import { YesNoModal } from './Modals';
import { useDeleteTaskMutation } from 'reduxStore/services/api/tasks';
import TaskCompletionPressable from './TaskCompletionPressable';
import useCanMarkComplete from 'hooks/useCanMarkComplete';
import useHasEditPerms from 'hooks/useHasEditPerms';
import { StyleSheet } from 'react-native';
import { useCreateTaskCompletionFormMutation } from 'reduxStore/services/api/taskCompletionForms';
import { Toast } from 'react-native-toast-message/lib/src/Toast';

const styles = StyleSheet.create({
  modalBox: { paddingHorizontal: 30 }
});

const MarkIncompleteButton = () => {
  const [markingRecurrentComplete, setMarkingRecurrentComplete] =
    useState(false);

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [createTaskCompletionForm, createTaskCompletionFormResult] =
    useCreateTaskCompletionFormMutation();

  const taskToAction = useSelector(selectTaskToAction);
  const scheduledTask = useSelector(
    selectScheduledTask(
      taskToAction
        ? {
            id: taskToAction.taskId,
            recurrenceIndex: taskToAction.recurrenceIndex,
            actionId: taskToAction.actionId
          }
        : { id: -1, recurrenceIndex: null, actionId: null }
    )
  );

  const overdueTasks = useSelector(selectOverdueTasks);
  const otherOverdueTasksInSeries = useMemo(() => {
    if (!scheduledTask) {
      return [];
    }
    return overdueTasks.filter(
      (overdueTask) =>
        overdueTask.id === scheduledTask.id &&
        overdueTask.recurrence_index !== scheduledTask.recurrence_index
    );
  }, [overdueTasks, scheduledTask]);

  if (!taskToAction) {
    return null;
  }

  return (
    <>
      <LinkButton
        onPress={async () => {
          if (otherOverdueTasksInSeries.length > 0) {
            setMarkingRecurrentComplete(true);
          } else {
            try {
              dispatch(setTaskToAction(null));
              await createTaskCompletionForm({
                task: taskToAction.taskId,
                recurrence_index: taskToAction.recurrenceIndex,
                ignore: true
              }).unwrap();
            } catch {
              Toast.show({
                type: 'error',
                text1: t('common.errors.generic')
              });
            }
          }
        }}
        title={t('components.task.markIncomplete')}
      />
      <YesNoModal
        question={t('components.task.markAllOverdueAsIncompleteQuestion')}
        visible={markingRecurrentComplete}
        onRequestClose={() => setMarkingRecurrentComplete(false)}
        onYes={async () => {
          setMarkingRecurrentComplete(false);
          dispatch(setTaskToAction(null));
          if (taskToAction) {
            try {
              await createTaskCompletionForm([
                ...otherOverdueTasksInSeries.map((overdueTask) => ({
                  task: overdueTask.id,
                  recurrence_index: overdueTask.recurrence_index,
                  ignore: true
                })),
                {
                  task: taskToAction.taskId,
                  recurrence_index: taskToAction.recurrenceIndex,
                  ignore: true
                }
              ]).unwrap();
            } catch {
              Toast.show({
                type: 'error',
                text1: t('common.errors.generic')
              });
            }
          }
        }}
        onNo={async () => {
          setMarkingRecurrentComplete(false);
          dispatch(setTaskToAction(null));
          if (taskToAction) {
            try {
              await createTaskCompletionForm({
                task: taskToAction.taskId,
                recurrence_index: taskToAction.recurrenceIndex,
                ignore: true
              }).unwrap();
            } catch {
              Toast.show({
                type: 'error',
                text1: t('common.errors.generic')
              });
            }
          }
        }}
      />
    </>
  );
};

export default function TaskActionModal() {
  const [deletingOccurrence, setDeletingOccurrence] = useState(false);
  const [deletingTask, setDeletingTask] = useState(false);
  const navigation = useNavigation<StackNavigationProp<RootTabParamList>>();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [deleteTask] = useDeleteTaskMutation();
  const taskToAction = useSelector(selectTaskToAction);
  const task = useSelector(selectTaskById(taskToAction?.taskId || -1));
  const scheduledTask = useSelector(
    selectScheduledTask(
      taskToAction
        ? {
            id: taskToAction.taskId,
            recurrenceIndex: taskToAction.recurrenceIndex,
            actionId: taskToAction.actionId
          }
        : { id: -1, recurrenceIndex: null, actionId: null }
    )
  );

  const canMarkComplete = useCanMarkComplete({
    taskId: task?.id || -1,
    recurrenceIndex: taskToAction?.recurrenceIndex,
    actionId: taskToAction?.actionId
  });

  const hasEditPerms = useHasEditPerms(task?.id || -1);

  return (
    <Modal
      visible={!!taskToAction}
      onRequestClose={() => {
        dispatch(setTaskToAction(null));
      }}
      boxStyle={styles.modalBox}
    >
      {hasEditPerms ? (
        task?.recurrence ? (
          <>
            <LinkButton
              onPress={() => {
                if (taskToAction) {
                  // We don't need to be able to edit specific instances
                  // of birthdays
                  if (['BIRTHDAY', 'ANNIVERSARY'].includes(task.type)) {
                    navigation.navigate('EditTask', {
                      taskId: taskToAction.taskId
                    });
                  } else {
                    navigation.navigate('EditTask', {
                      taskId: taskToAction.taskId,
                      recurrenceIndex:
                        taskToAction.recurrenceIndex === null
                          ? -1
                          : taskToAction.recurrenceIndex,
                      recurrenceOverwrite: true
                    });
                  }
                  dispatch(setTaskToAction(null));
                }
              }}
              title={t('components.task.editTask')}
            />
            <LinkButton
              onPress={() => {
                setDeletingOccurrence(true);
              }}
              title={t('common.delete')}
            />
          </>
        ) : (
          <>
            <LinkButton
              onPress={() => {
                if (taskToAction) {
                  navigation.navigate('EditTask', {
                    taskId: taskToAction.taskId
                  });
                  dispatch(setTaskToAction(null));
                }
              }}
              title={t('components.task.editTask')}
            />
            <LinkButton
              onPress={() => {
                setDeletingTask(true);
              }}
              title={t('common.delete')}
            />
          </>
        )
      ) : null}
      {taskToAction && (
        <LinkButton
          onPress={() => {
            if (taskToAction) {
              (navigation.navigate as any)('Chat', {
                screen: 'MessageThread',
                initial: false,
                params: taskToAction
              });
              dispatch(setTaskToAction(null));
            }
          }}
          title={t('components.task.messages')}
        />
      )}
      {taskToAction &&
        !taskToAction.actionId &&
        task &&
        task.type !== 'USER_BIRTHDAY' && (
          <LinkButton
            onPress={() => {
              if (taskToAction) {
                (navigation.navigate as any)('AddTask', {
                  ...task
                });
                dispatch(setTaskToAction(null));
              }
            }}
            title={t('components.task.duplicateTask')}
          />
        )}
      {canMarkComplete &&
        taskToAction &&
        scheduledTask &&
        !scheduledTask.is_complete && (
          <>
            <TaskCompletionPressable
              taskId={taskToAction.taskId}
              recurrenceIndex={
                taskToAction.recurrenceIndex === null
                  ? undefined
                  : taskToAction.recurrenceIndex
              }
              actionId={taskToAction.actionId}
              onPress={() => dispatch(setTaskToAction(null))}
            >
              <LinkButton
                onPress={() => {}}
                title={t('components.task.markComplete')}
                disabled={true}
              />
            </TaskCompletionPressable>
            {!taskToAction.actionId && (
              <>
                <LinkButton
                  onPress={() => {
                    dispatch(setTaskToAction(null));
                    dispatch(
                      setTaskToPartiallyComplete({
                        taskId: taskToAction.taskId,
                        recurrenceIndex: taskToAction.recurrenceIndex,
                        actionId: taskToAction.actionId
                      })
                    );
                  }}
                  title={t('components.task.markPartiallyCompleteAndRepeat')}
                />
                <LinkButton
                  onPress={() => {
                    dispatch(setTaskToAction(null));
                    dispatch(
                      setTaskToReschedule({
                        taskId: taskToAction.taskId,
                        recurrenceIndex: taskToAction.recurrenceIndex,
                        actionId: taskToAction.actionId
                      })
                    );
                  }}
                  title={t('components.task.markIncompleteAndReschedule')}
                />
                <MarkIncompleteButton />
              </>
            )}
          </>
        )}
      <DeleteTaskModal
        visible={deletingOccurrence}
        onRequestClose={() => setDeletingOccurrence(false)}
        recurrence={task?.recurrence?.id || -1}
        recurrenceIndex={
          taskToAction?.recurrenceIndex === null ||
          taskToAction?.recurrenceIndex === undefined
            ? -1
            : taskToAction?.recurrenceIndex
        }
        taskId={task?.id || -1}
      />
      <YesNoModal
        title={t('common.delete')}
        question={t('components.task.deleteConfirmation')}
        visible={deletingTask}
        onYes={() => {
          if (task?.id) {
            deleteTask({ id: task.id });
            setDeletingTask(false);
            dispatch(setTaskToAction(null));
          }
        }}
        onNo={() => {
          setDeletingTask(false);
        }}
      />
    </Modal>
  );
}
