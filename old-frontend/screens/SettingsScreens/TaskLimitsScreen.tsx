import { useTranslation } from 'react-i18next';
import {
  useCreateTaskLimitMutation,
  useGetAllTaskLimitsQuery,
  useUpdateTaskLimitMutation
} from 'reduxStore/services/api/taskLimits';
import {
  TransparentPaddedView,
  TransparentView
} from 'components/molecules/ViewComponents';
import { FullPageSpinner } from 'components/molecules/Spinners';
import { Table, TableWrapper, Row, Col } from 'react-native-table-component';
import { Pressable, StyleSheet } from 'react-native';
import { Modal } from 'components/molecules/Modals';
import { TaskLimitInterval, TaskLimitLimitFields } from 'types/taskLimits';
import { Text, TextInput } from 'components/Themed';
import { useEffect, useState } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import { Button } from 'components/molecules/ButtonComponents';
import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import SafePressable from 'components/molecules/SafePressable';
import { useGetAllCategoriesQuery } from 'reduxStore/services/api/categories';

type LimitType = 'TASKS' | 'MINUTES';

const styles = StyleSheet.create({
  tableText: {
    textAlign: 'center',
    margin: 4
  },
  tableHeaderText: {
    fontWeight: 'bold'
  }
});

const TypePicker = ({
  value,
  onChange
}: {
  value: LimitType;
  onChange: (int: LimitType) => void;
}) => {
  const [open, setOpen] = useState(false);

  return (
    <DropDownPicker
      value={value}
      items={[
        {
          value: 'TASKS',
          label: 'tasks'
        },
        {
          value: 'MINUTES',
          label: 'minutes'
        }
      ]}
      multiple={false}
      setValue={(item) => {
        if (item(null)) {
          onChange(item(null));
        }
      }}
      open={open}
      setOpen={setOpen}
      listMode="MODAL"
    />
  );
};
const EditTaskLimitForm = ({
  value,
  onChange
}: {
  value: TaskLimitLimitFields;
  onChange: (val: TaskLimitLimitFields) => void;
}) => {
  return (
    <TransparentView
      style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}
    >
      <TransparentView style={{ width: '50%', marginRight: 10 }}>
        <TextInput
          value={`${value.tasks_limit || value.minutes_limit || ''}`}
          keyboardType="numeric"
          onChangeText={(limitValue) => {
            if (value.tasks_limit) {
              onChange({
                tasks_limit: parseInt(limitValue),
                minutes_limit: null
              });
            } else {
              onChange({
                minutes_limit: parseInt(limitValue),
                tasks_limit: null
              });
            }
          }}
        />
      </TransparentView>
      <TransparentView style={{ width: '50%' }}>
        <TypePicker
          value={value.tasks_limit ? 'TASKS' : 'MINUTES'}
          onChange={(limitType) => {
            if (limitType === 'TASKS') {
              onChange({
                tasks_limit: value.tasks_limit || value.minutes_limit,
                minutes_limit: null
              });
            } else {
              onChange({
                minutes_limit: value.tasks_limit || value.minutes_limit,
                tasks_limit: null
              });
            }
          }}
        />
      </TransparentView>
    </TransparentView>
  );
};

type EditTaskLimitModalProps = {
  categoryId: number;
  interval: TaskLimitInterval;
  visible: boolean;
  onRequestClose: () => void;
};
const EditTaskLimitModal = ({
  categoryId,
  interval,
  visible,
  onRequestClose
}: EditTaskLimitModalProps) => {
  const { data: taskLimits, isLoading: isLoadingTaskLimits } =
    useGetAllTaskLimitsQuery();

  const { t } = useTranslation();

  const [updateTaskLimit, updateTaskLimitResult] = useUpdateTaskLimitMutation();
  const [createTaskLimit, createTaskLimitResult] = useCreateTaskLimitMutation();
  const { data: userDetails } = useGetUserFullDetails();

  const defaultLimits = {
    minutes_limit: 120,
    tasks_limit: null
  };
  const [newLimits, setNewLimits] = useState<TaskLimitLimitFields>({
    ...defaultLimits
  });
  const [taskLimitToUpdate, setTaskLimitToUpdate] = useState<number | null>(
    null
  );

  useEffect(() => {
    if (taskLimits) {
      const taskLimitToEdit = Object.values(taskLimits.byId).find(
        (taskLimit) =>
          taskLimit.category === categoryId && taskLimit.interval === interval
      );
      if (taskLimitToEdit) {
        setNewLimits({
          ...taskLimitToEdit
        });
        setTaskLimitToUpdate(taskLimitToEdit.id);
      } else {
        setTaskLimitToUpdate(null);
        setNewLimits({ ...defaultLimits });
      }
    }
  }, [categoryId, interval, taskLimits]);

  const isLoading = isLoadingTaskLimits || !taskLimits || !userDetails;
  if (isLoading) {
    return null;
  }

  return (
    <Modal visible={visible} onRequestClose={onRequestClose}>
      <EditTaskLimitForm value={newLimits} onChange={setNewLimits} />
      <Button
        title={t('common.update')}
        onPress={() => {
          if (!taskLimitToUpdate) {
            createTaskLimit({
              interval,
              category: categoryId,
              user: userDetails.id,
              ...newLimits
            })
              .unwrap()
              .then(() => {
                onRequestClose();
              })
              .catch((err) => {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              });
          } else {
            updateTaskLimit({
              id: taskLimitToUpdate,
              interval,
              category: categoryId,
              ...newLimits
            })
              .unwrap()
              .then(() => {
                onRequestClose();
              })
              .catch((err) => {
                Toast.show({
                  type: 'error',
                  text1: t('common.errors.generic')
                });
              });
          }
        }}
      />
    </Modal>
  );
};

export default function TaskLimitsScreen() {
  const { data: allCategories, isLoading: isLoadingCategories } =
    useGetAllCategoriesQuery();

  const { data: taskLimits, isLoading: isLoadingTaskLimits } =
    useGetAllTaskLimitsQuery();

  const [taskLimitToEdit, setTaskLimitToEdit] = useState<{
    categoryId: number;
    interval: TaskLimitInterval;
  } | null>(null);

  const { t } = useTranslation();

  const isLoading =
    isLoadingTaskLimits || isLoadingCategories || !allCategories || !taskLimits;

  if (isLoading) {
    return <FullPageSpinner />;
  }

  const TaskLimitPressable = ({
    categoryId,
    text,
    interval
  }: {
    categoryId: number;
    text: string;
    interval: TaskLimitInterval;
  }) => {
    return (
      <SafePressable
        onPress={() =>
          setTaskLimitToEdit({
            categoryId,
            interval
          })
        }
      >
        <Text style={styles.tableText}>{text}</Text>
      </SafePressable>
    );
  };

  const DailyPressable = ({
    categoryId,
    text
  }: {
    categoryId: number;
    text: string;
  }) => {
    return (
      <TaskLimitPressable
        categoryId={categoryId}
        text={text}
        interval={'DAILY'}
      />
    );
  };

  const MonthlyPressable = ({
    categoryId,
    text
  }: {
    categoryId: number;
    text: string;
  }) => {
    return (
      <TaskLimitPressable
        categoryId={categoryId}
        text={text}
        interval={'MONTHLY'}
      />
    );
  };

  const categoryIds = allCategories.ids;
  const dailyLimitCells: { [key: number]: React.ReactNode } = {};
  const monthlyLimitCells: { [key: number]: React.ReactNode } = {};
  for (const id of categoryIds) {
    const categoryDayLimit = Object.values(taskLimits.byId).find(
      (limit) => limit.interval === 'DAILY' && limit.category === id
    );

    if (!categoryDayLimit) {
      dailyLimitCells[id] = <DailyPressable categoryId={id} text="-" />;
    }

    if (categoryDayLimit?.minutes_limit) {
      dailyLimitCells[id] = (
        <DailyPressable
          categoryId={id}
          text={`${categoryDayLimit.minutes_limit} ${t('common.minutes')}`}
        />
      );
    }

    if (categoryDayLimit?.tasks_limit) {
      dailyLimitCells[id] = (
        <DailyPressable
          categoryId={id}
          text={`${categoryDayLimit.tasks_limit} ${t('common.tasks')}`}
        />
      );
    }

    const categoryMonthLimit = Object.values(taskLimits.byId).find(
      (limit) => limit.interval === 'MONTHLY' && limit.category === id
    );

    if (!categoryMonthLimit) {
      monthlyLimitCells[id] = <MonthlyPressable categoryId={id} text="-" />;
    }

    if (categoryMonthLimit?.minutes_limit) {
      monthlyLimitCells[id] = (
        <MonthlyPressable
          categoryId={id}
          text={`${categoryMonthLimit.minutes_limit} ${t('common.minutes')}`}
        />
      );
    }

    if (categoryMonthLimit?.tasks_limit) {
      monthlyLimitCells[id] = (
        <MonthlyPressable
          categoryId={id}
          text={`${categoryMonthLimit.tasks_limit} ${t('common.tasks')}`}
        />
      );
    }
  }

  const rowHeight = 44;
  const headerHeight = 60;

  return (
    <TransparentPaddedView style={{ flex: 1 }}>
      <Table borderStyle={{ borderWidth: 1 }}>
        <Row
          data={['', 'Daily', 'Monthly']}
          style={{ width: '100%', height: headerHeight }}
          textStyle={StyleSheet.flatten([
            styles.tableText,
            styles.tableHeaderText
          ])}
        />
        <TableWrapper style={{ flexDirection: 'row' }}>
          <Col
            heightArr={categoryIds.map((id) => rowHeight)}
            data={categoryIds.map((id) => allCategories.byId[id].readable_name)}
            textStyle={StyleSheet.flatten([
              styles.tableText,
              styles.tableHeaderText
            ])}
          />
          <Col
            heightArr={categoryIds.map((id) => rowHeight)}
            data={categoryIds.map((id) => dailyLimitCells[id])}
            textStyle={styles.tableText}
          />
          <Col
            heightArr={categoryIds.map((id) => rowHeight)}
            data={categoryIds.map((id) => monthlyLimitCells[id])}
            textStyle={styles.tableText}
          />
        </TableWrapper>
      </Table>
      <EditTaskLimitModal
        visible={!!taskLimitToEdit}
        interval={taskLimitToEdit?.interval || 'DAILY'}
        categoryId={taskLimitToEdit?.categoryId || 0}
        onRequestClose={() => setTaskLimitToEdit(null)}
      />
    </TransparentPaddedView>
  );
}
