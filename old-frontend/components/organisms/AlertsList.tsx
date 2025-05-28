import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import { SmallButton } from 'components/molecules/ButtonComponents';
import ElevatedPressableBox from 'components/molecules/ElevatedPressableBox';
import EntityTags from 'components/molecules/EntityTags';
import OptionTags from 'components/molecules/OptionTags';
import { TransparentScrollView } from 'components/molecules/ScrollViewComponents';
import { FullPageSpinner } from 'components/molecules/Spinners';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, StyleSheet } from 'react-native';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import { useDispatch, useSelector } from 'react-redux';
import {
  useDeleteActionAlertMutation,
  useDeleteAlertMutation,
  useGetAllActionAlertsQuery,
  useGetAllAlertsQuery,
  useMarkAlertsReadMutation
} from 'reduxStore/services/api/alerts';
import {
  selectActionAlertById,
  selectAlertById,
  selectAlertsByActionId,
  selectAlertsByTaskId,
  selectHasUnreadAlert
} from 'reduxStore/slices/alerts/selectors';
import {
  setEnforcedDate,
  setLastUpdateId
} from 'reduxStore/slices/calendars/actions';
import {
  selectScheduledTask,
  selectTaskActionById
} from 'reduxStore/slices/tasks/selectors';
import { selectTaskById } from 'reduxStore/slices/tasks/selectors';
import {
  selectCurrentUserId,
  selectFamilyMemberFromId
} from 'reduxStore/slices/users/selectors';
import { RootTabParamList } from 'types/base';
import { ScheduledTaskResponseType } from 'types/tasks';
import { getDateStringFromDateObject } from 'utils/datesAndTimes';

const alertEntryStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  ignoreButtonText: { fontSize: 24, color: 'red', marginLeft: 20 }
});
const AlertEntry = ({ alertId }: { alertId: number }) => {
  const alert = useSelector(selectAlertById(alertId));
  const currentUserId = useSelector(selectCurrentUserId);
  const user = useSelector(
    selectFamilyMemberFromId(currentUserId || -1, alert?.user || -1)
  );
  const { t } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const dispatch = useDispatch();
  const [deleteAlert] = useDeleteAlertMutation();

  const task = useSelector(selectTaskById(alert?.task || -1));

  if (!alert || !task) {
    return null;
  }

  return (
    <TransparentView style={alertEntryStyles.container}>
      <SmallButton
        title={alert.type}
        onPress={() => {
          if (alert.type === 'UNPREFERRED_DAY') {
            navigation.navigate('SettingsNavigator', {
              screen: 'PreferredDayPreferences',
              initial: false
            });
          }
          if (alert.type === 'BLOCKED_DAY') {
            navigation.navigate('SettingsNavigator', {
              screen: 'BlockedDayPreferences',
              initial: false
            });
          }
          if (alert.type === 'TASK_LIMIT_EXCEEDED') {
            navigation.navigate('SettingsNavigator', {
              screen: 'TaskLimits',
              initial: false
            });
          }
          if (alert.type === 'TASK_CONFLICT') {
            const start = task.start_datetime || task.start_date || task.date;

            if (start) {
              dispatch(
                setEnforcedDate({
                  date: getDateStringFromDateObject(new Date(start))
                })
              );
              dispatch(setLastUpdateId(String(new Date())));

              navigation.navigate('Home');
            }
          }
        }}
      />
      <Pressable
        onPress={async () => {
          try {
            await deleteAlert({ id: alertId, task: alert.task }).unwrap();
          } catch (err) {
            Toast.show({
              type: 'error',
              text1: t('common.errors.generic')
            });
          }
        }}
      >
        {currentUserId === user?.id && (
          <Text style={alertEntryStyles.ignoreButtonText}>X</Text>
        )}
      </Pressable>
    </TransparentView>
  );
};

const ActionAlertEntry = ({ actionAlertId }: { actionAlertId: number }) => {
  const alert = useSelector(selectActionAlertById(actionAlertId));
  const currentUserId = useSelector(selectCurrentUserId);
  const user = useSelector(
    selectFamilyMemberFromId(currentUserId || -1, alert?.user || -1)
  );
  const { t } = useTranslation();
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const dispatch = useDispatch();
  const [deleteAlert] = useDeleteActionAlertMutation();

  const action = useSelector(selectTaskActionById(alert?.action || -1));
  const task = useSelector(
    selectScheduledTask({
      id: action?.task,
      actionId: action?.id
    })
  );

  if (!alert || !action || !task) {
    return null;
  }

  return (
    <TransparentView style={alertEntryStyles.container}>
      <SmallButton
        title={alert.type}
        onPress={() => {
          if (alert.type === 'UNPREFERRED_DAY') {
            navigation.navigate('SettingsNavigator', {
              screen: 'PreferredDayPreferences',
              initial: false
            });
          }
          if (alert.type === 'BLOCKED_DAY') {
            navigation.navigate('SettingsNavigator', {
              screen: 'BlockedDayPreferences',
              initial: false
            });
          }
          if (alert.type === 'TASK_LIMIT_EXCEEDED') {
            navigation.navigate('SettingsNavigator', {
              screen: 'TaskLimits',
              initial: false
            });
          }
          if (alert.type === 'TASK_CONFLICT') {
            const start = task.start_datetime || task.start_date || task.date;

            if (start) {
              dispatch(
                setEnforcedDate({
                  date: getDateStringFromDateObject(new Date(start))
                })
              );
              dispatch(setLastUpdateId(String(new Date())));

              navigation.navigate('Home');
            }
          }
        }}
      />
      <Pressable
        onPress={async () => {
          try {
            await deleteAlert({
              id: actionAlertId,
              action: alert.action
            }).unwrap();
          } catch (err) {
            Toast.show({
              type: 'error',
              text1: t('common.errors.generic')
            });
          }
        }}
      >
        {currentUserId === user?.id && (
          <Text style={alertEntryStyles.ignoreButtonText}>X</Text>
        )}
      </Pressable>
    </TransparentView>
  );
};

const taskAlertStyles = StyleSheet.create({
  card: { marginBottom: 10 },
  tagsWrapper: {
    flexDirection: 'row',
    width: '50%',
    flex: 0
  }
});
const TaskAlerts = ({ taskId }: { taskId: number | null }) => {
  const task = useSelector(selectTaskById(taskId || -1));
  const alerts = useSelector(selectAlertsByTaskId(taskId || -1));

  const navigation = useNavigation();

  if (!task || alerts.length === 0) {
    return null;
  }

  const alertList = alerts.map((alertId) => (
    <AlertEntry alertId={alertId} key={alertId} />
  ));

  return (
    <ElevatedPressableBox
      style={taskAlertStyles.card}
      onPress={() => (navigation.navigate as any)('EditTask', { taskId })}
    >
      <Text>{task.title}</Text>
      <Text>
        {task.date || `${task.start_datetime} - ${task.end_datetime}`}
      </Text>
      <TransparentScrollView style={taskAlertStyles.tagsWrapper} horizontal>
        <EntityTags entities={task.entities} />
        <OptionTags tagNames={task.tags} />
      </TransparentScrollView>
      {alertList}
    </ElevatedPressableBox>
  );
};

const TaskActionAlerts = ({ actionId }: { actionId: number }) => {
  const action = useSelector(selectTaskActionById(actionId));
  const actionAlerts = useSelector(selectAlertsByActionId(actionId));
  const task = useSelector(selectTaskById(action?.task || -1));
  const scheduledAction = useSelector(selectScheduledTask({ actionId }));

  const navigation = useNavigation();

  if (!action || !task || !scheduledAction || actionAlerts.length === 0) {
    return null;
  }

  const alertList = actionAlerts.map((actionAlertId) => (
    <ActionAlertEntry actionAlertId={actionAlertId} key={actionAlertId} />
  ));

  return (
    <ElevatedPressableBox
      style={taskAlertStyles.card}
      onPress={
        () => {}
        // (navigation.navigate as any)('EditTask', { taskId: task.id })
      }
    >
      <Text>{`ACTION - ${task.title}`}</Text>
      <TransparentScrollView style={taskAlertStyles.tagsWrapper} horizontal>
        <EntityTags entities={task.entities} />
        <OptionTags tagNames={task.tags} />
      </TransparentScrollView>
      <Text>
        {scheduledAction.date ||
          `${scheduledAction.start_datetime} - ${scheduledAction.end_datetime}`}
      </Text>
      {alertList}
    </ElevatedPressableBox>
  );
};

const listStyles = StyleSheet.create({
  container: { height: '100%', width: '100%' },
  scrollView: { padding: 10 },
  listView: { paddingBottom: 250 }
});

export default function AlertsList() {
  const { t } = useTranslation();
  const { data: allAlerts, isLoading: isLoadingAlerts } =
    useGetAllAlertsQuery();

  const { data: allActionAlerts, isLoading: isLoadingActionAlerts } =
    useGetAllActionAlertsQuery();

  const { data: userDetails } = useGetUserFullDetails();

  const [markAlertsRead] = useMarkAlertsReadMutation();

  const hasUnreadAlert = useSelector(selectHasUnreadAlert);

  useEffect(() => {
    if (userDetails && hasUnreadAlert) {
      markAlertsRead(userDetails.id);
    }
  }, [hasUnreadAlert, userDetails, markAlertsRead]);

  if (
    isLoadingAlerts ||
    !allAlerts ||
    isLoadingActionAlerts ||
    !allActionAlerts
  ) {
    return <FullPageSpinner />;
  }

  const alertedTasks = Object.keys(allAlerts.byTask).map((tsk) =>
    parseInt(tsk)
  );

  const alertedActions = Object.keys(allActionAlerts.byAction).map((action) =>
    parseInt(action)
  );

  if (alertedTasks.length === 0 && alertedActions.length === 0) {
    return (
      <TransparentPaddedView>
        <Text>{t('components.alertsList.noAlerts')}</Text>
      </TransparentPaddedView>
    );
  }

  const isAlert = (
    item:
      | {
          task?: number;
          action?: number;
          type: string;
        }
      | {
          task: ScheduledTaskResponseType;
          type: string;
        }
  ): item is {
    task: number;
    action: number;
    type: string;
  } => {
    return item.type === 'ALERT';
  };

  const isActionAlert = (
    item:
      | {
          task?: number;
          action?: number;
          type: string;
        }
      | {
          task: ScheduledTaskResponseType;
          type: string;
        }
  ): item is {
    task: number;
    action: number;
    type: string;
  } => {
    return item.type === 'ACTION_ALERT';
  };

  return (
    <TransparentView style={listStyles.container}>
      <FlatList
        data={[
          ...alertedTasks.map((task) => ({ task, type: 'ALERT' })),
          ...alertedActions.map((action) => ({ action, type: 'ACTION_ALERT' }))
        ]}
        contentContainerStyle={listStyles.listView}
        renderItem={({ item }) => {
          if (isAlert(item)) {
            return (
              <TaskAlerts taskId={item.task} key={item.task || item.action} />
            );
          } else if (isActionAlert(item)) {
            return (
              <TaskActionAlerts
                actionId={item.action}
                key={item.task || item.action}
              />
            );
          }

          return null;
        }}
        style={listStyles.scrollView}
      />
    </TransparentView>
  );
}
