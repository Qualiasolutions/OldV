import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useNavigation } from '@react-navigation/native';
import ElevatedPressableBox from 'components/molecules/ElevatedPressableBox';
import { WhiteFullPageScrollView } from 'components/molecules/ScrollViewComponents';
import { FullPageSpinner } from 'components/molecules/Spinners';
import { TransparentPaddedView } from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import useEntityById from 'hooks/entities/useEntityById';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { t } from 'i18next';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useGetAllEntitiesQuery } from 'reduxStore/services/api/entities';
import {
  TaskCompletionForm,
  useGetTaskCompletionFormsQuery
} from 'reduxStore/services/api/taskCompletionForms';
import { useGetAllTasksQuery } from 'reduxStore/services/api/tasks';
import {
  useCreateLastActivityViewMutation,
  useGetLastActivityViewQuery,
  useUpdateLastActivityViewMutation
} from 'reduxStore/services/api/user';
import {
  setEnforcedDate,
  setLastUpdateId
} from 'reduxStore/slices/calendars/actions';
import {
  selectNewEntityIds,
  selectNewTaskCompletionFormIds
} from 'reduxStore/slices/entities/selectors';
import { selectHasUnseenActivity } from 'reduxStore/slices/misc/selectors';
import {
  selectNewTaskIds,
  selectTaskById,
  selectTaskCompletionFormById
} from 'reduxStore/slices/tasks/selectors';
import { RootTabParamList } from 'types/base';
import { EntityResponseType } from 'types/entities';
import { FixedTaskResponseType } from 'types/tasks';
import { getDateStringFromDateObject } from 'utils/datesAndTimes';

const cardStyles = StyleSheet.create({
  card: { marginBottom: 5 }
});
const NewEntityCard = ({ entityId }: { entityId: number }) => {
  const entity = useEntityById(entityId);
  const navigation = useNavigation();

  if (!entity) {
    return null;
  }
  return (
    <ElevatedPressableBox
      style={cardStyles.card}
      onPress={() => {
        (navigation.navigate as any)('ContentNavigator', {
          screen: 'EntityScreen',
          initial: false,
          params: {
            entityId,
            screen: 'Edit'
          }
        });
      }}
    >
      <Text bold={true}>{t('components.newItemsList.newEntity')}</Text>
      <Text bold={true}>{entity.name}</Text>
      <Text>
        {t('components.newItemsList.createdOn')}{' '}
        {String(new Date(entity.created_at))}
      </Text>
    </ElevatedPressableBox>
  );
};

const NewTaskCard = ({ taskId }: { taskId: number }) => {
  const task = useSelector(selectTaskById(taskId));
  const navigation = useNavigation<BottomTabNavigationProp<RootTabParamList>>();
  const dispatch = useDispatch();

  if (!task) {
    return null;
  }
  return (
    <ElevatedPressableBox
      style={cardStyles.card}
      onPress={() => {
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
      }}
    >
      <Text bold={true}>{t('components.newItemsList.newTask')}</Text>
      <Text bold={true}>{task.title}</Text>
      <Text>Created on {String(new Date(task.created_at))}</Text>
    </ElevatedPressableBox>
  );
};

const NewTaskCompletionCard = ({
  taskCompletionId
}: {
  taskCompletionId: number;
}) => {
  const form = useSelector(selectTaskCompletionFormById(taskCompletionId));
  const navigation = useNavigation();
  const task = useSelector(selectTaskById(form ? form.task : -1));
  const { data: user } = useGetUserFullDetails();

  if (!task || !form || !user?.is_premium) {
    return null;
  }

  return (
    <ElevatedPressableBox style={cardStyles.card} onPress={() => {}}>
      <Text bold={true}>{t('components.newItemsList.newTaskCompletion')}</Text>
      <Text bold={true}>{task.title}</Text>
      <Text>
        {form.complete
          ? t('components.newItemsList.completedOn')
          : t('components.newItemsList.uncheckedOn')}{' '}
        {String(new Date(form?.completion_datetime))}
      </Text>
    </ElevatedPressableBox>
  );
};

const listStyles = StyleSheet.create({
  container: { paddingBottom: 300 },
  taskCardsWrapper: { marginTop: 50 },
  entityCardsWrapper: { marginTop: 20 }
});

const isTaskCompletionForm = (
  item: TaskCompletionForm | FixedTaskResponseType | EntityResponseType
): item is TaskCompletionForm => {
  return Object.keys(item).includes('completion_datetime');
};

export default function NewItemsList() {
  const { data: lastActivityView, isLoading: isLoadingLastActivity } =
    useGetLastActivityViewQuery();
  const [updateLastActivityView] = useUpdateLastActivityViewMutation();
  const [createLastActivityView] = useCreateLastActivityViewMutation();
  const { data: userDetails } = useGetUserFullDetails();

  const newEntityIds = useSelector(selectNewEntityIds);
  const newTaskIds = useSelector(selectNewTaskIds);
  const newTaskCompletionFormIds = useSelector(selectNewTaskCompletionFormIds);
  const hasUnseenActivity = useSelector(selectHasUnseenActivity);

  const { data: allEntities, isLoading: isLoadingEntities } =
    useGetAllEntitiesQuery();
  const { data: allTasks, isLoading: isLoadingTasks } = useGetAllTasksQuery();
  const {
    data: allTaskCompletionForms,
    isLoading: isLoadingTaskCompletionForms
  } = useGetTaskCompletionFormsQuery();

  useEffect(() => {
    if (hasUnseenActivity && userDetails && !isLoadingLastActivity) {
      if (lastActivityView?.id) {
        updateLastActivityView({ id: lastActivityView.id });
      } else {
        createLastActivityView({ user: userDetails.id });
      }
    }
  }, [
    userDetails,
    isLoadingLastActivity,
    updateLastActivityView,
    createLastActivityView,
    lastActivityView?.id,
    hasUnseenActivity
  ]);

  const isLoading =
    isLoadingEntities || isLoadingTasks || isLoadingTaskCompletionForms;

  if (isLoading) {
    return <FullPageSpinner />;
  }

  const orderedItems = [
    ...newEntityIds.map((id) => ({ id, type: 'ENTITY' })),
    ...newTaskIds.map((id) => ({ id, type: 'TASK' })),
    ...newTaskCompletionFormIds.map((id) => ({ id, type: 'TASK_COMPLETION' }))
  ].sort(({ id: idA, type: typeA }, { id: idB, type: typeB }) => {
    const itemA =
      typeA === 'ENTITY'
        ? allEntities?.byId[idA]
        : typeA === 'TASK'
        ? allTasks?.byId[idA]
        : allTaskCompletionForms?.byId[idA];
    const itemB =
      typeB === 'ENTITY'
        ? allEntities?.byId[idB]
        : typeB === 'TASK'
        ? allTasks?.byId[idB]
        : allTaskCompletionForms?.byId[idB];

    if (!itemA) {
      return -1;
    }

    if (!itemB) {
      return 1;
    }

    const timeA = isTaskCompletionForm(itemA)
      ? itemA.completion_datetime
      : itemA.created_at;

    const timeB = isTaskCompletionForm(itemB)
      ? itemB.completion_datetime
      : itemB.created_at;

    return timeA < timeB ? 1 : -1;
  });

  return (
    <WhiteFullPageScrollView>
      <TransparentPaddedView style={listStyles.container}>
        {orderedItems.map(({ id, type }) => {
          if (type === 'ENTITY') {
            return <NewEntityCard entityId={id} key={`${type}_${id}`} />;
          }
          if (type === 'TASK') {
            return <NewTaskCard taskId={id} key={`${type}_${id}`} />;
          }
          if (type === 'TASK_COMPLETION') {
            return (
              <NewTaskCompletionCard
                taskCompletionId={id}
                key={`${type}_${id}`}
              />
            );
          }
        })}
      </TransparentPaddedView>
    </WhiteFullPageScrollView>
  );
}
