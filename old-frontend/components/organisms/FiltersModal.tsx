import { Feather } from '@expo/vector-icons';
import { Button } from 'components/molecules/ButtonComponents';
import { Modal } from 'components/molecules/Modals';
import SafePressable from 'components/molecules/SafePressable';
import UserCheckboxes from 'components/molecules/UserCheckboxes';
import { TransparentView } from 'components/molecules/ViewComponents';
import { Text } from 'components/Themed';
import { ReactNode, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import {
  setCompletionFilters,
  setFilteredCategories,
  setFilteredTaskTypes,
  setFilteredUsers,
  setFiltersModalOpen
} from 'reduxStore/slices/calendars/actions';
import {
  selectCompletionFilters,
  selectFilteredCategories,
  selectFilteredTaskTypes,
  selectFilteredUsers,
  selectFiltersModalOpen
} from 'reduxStore/slices/calendars/selectors';
import { TransparentScrollView } from 'components/molecules/ScrollViewComponents';
import CategoryCheckboxes from 'components/organisms/CategoryCheckboxes';
import { TaskType } from 'types/tasks';
import CheckboxesList from 'components/molecules/CheckboxesList';
import useGetUserFullDetails from 'hooks/useGetUserDetails';

const styles = StyleSheet.create({
  modal: {
    width: '100%',
    maxHeight: '100%'
  },
  filterTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  filterTypeTitle: { fontSize: 20, margin: 10 },
  userFiltersApplyButton: { marginTop: 10 },
  buttonWrapper: { flexDirection: 'row', justifyContent: 'center' },
  filtersButton: { alignItems: 'center' },
  filtersButtonText: { fontSize: 11 }
});

const UserFilterSelector = ({
  value,
  onValueChange
}: {
  value: number[];
  onValueChange: (newUsers: number[]) => void;
}) => {
  return (
    <TransparentView>
      <UserCheckboxes
        value={value}
        onToggleUser={(userId) => {
          if (value.includes(userId)) {
            onValueChange(value.filter((id) => id !== userId));
          } else {
            onValueChange([...value, userId]);
          }
        }}
      />
    </TransparentView>
  );
};

const TaskTypeSelector = ({
  value,
  onValueChange
}: {
  value: (TaskType | 'OTHER')[];
  onValueChange: (taskTypes: (TaskType | 'OTHER')[]) => void;
}) => {
  const { t } = useTranslation();
  const taskTypeOptions: {
    value: TaskType | 'OTHER';
    label: string;
    checked: boolean;
  }[] = [
    {
      value: 'TASK',
      label: t('taskTypes.TASK'),
      checked: value.includes('TASK')
    },
    {
      value: 'APPOINTMENT',
      label: t('taskTypes.APPOINTMENT'),
      checked: value.includes('APPOINTMENT')
    },
    {
      value: 'OTHER',
      label: t('common.other'),
      checked: value.includes('OTHER')
    }
  ];
  return (
    <CheckboxesList
      options={taskTypeOptions}
      onToggleItem={(taskType: TaskType | 'OTHER') => {
        if (value.includes(taskType)) {
          onValueChange(value.filter((val) => val !== taskType));
        } else {
          onValueChange([...value, taskType]);
        }
      }}
    />
  );
};

const CompletionFilterSelector = ({
  value,
  onValueChange
}: {
  value: ('COMPLETE' | 'INCOMPLETE')[];
  onValueChange: (completionTypes: ('COMPLETE' | 'INCOMPLETE')[]) => void;
}) => {
  const { t } = useTranslation();
  const completionOptions = [
    // {
    //   value: 'COMPLETE',
    //   label: t('common.complete'),
    //   checked: value.includes('COMPLETE')
    // },
    {
      value: 'INCOMPLETE',
      label: t('common.incomplete'),
      checked: value.includes('INCOMPLETE')
    }
  ];

  return (
    <CheckboxesList
      options={completionOptions}
      onToggleItem={(completionType) => {
        if (value.includes(completionType)) {
          onValueChange(value.filter((val) => val !== completionType));
        } else {
          onValueChange([...value, completionType]);
        }
      }}
    />
  );
};

const ExpandableSection = ({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) => {
  const [expanded, setExpanded] = useState(false);
  return (
    <TransparentView>
      <SafePressable
        onPress={() => setExpanded(!expanded)}
        style={styles.filterTypeHeader}
      >
        <Text style={styles.filterTypeTitle}>{title}</Text>
        <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={25} />
      </SafePressable>
      {expanded && children}
    </TransparentView>
  );
};

export default function FiltersModal() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const filteredUsers = useSelector(selectFilteredUsers);
  const filteredCategories = useSelector(selectFilteredCategories);
  const filteredTaskTypes = useSelector(selectFilteredTaskTypes);
  const completionFilters = useSelector(selectCompletionFilters);
  const filtersModalOpen = !!useSelector(selectFiltersModalOpen);

  const onFiltersClose = useCallback(() => {
    dispatch(setFiltersModalOpen(false));
  }, [dispatch]);


  const { data: user } = useGetUserFullDetails();

  const [newFilteredUsers, setNewFilteredUsers] = useState(filteredUsers);
  const [newFilteredCategories, setNewFilteredCategories] =
    useState(filteredCategories);
  const [newFilteredTaskTypes, setNewFilteredTaskTypes] =
    useState(filteredTaskTypes);
  const [newCompletionFilters, setNewCompletionFilters] =
    useState(completionFilters);

  const onUsersValueChange = useCallback(
    (newUsers: number[]) => {
      setNewFilteredUsers(newUsers);
    },
    [setNewFilteredUsers]
  );

  return (
    <Modal
      visible={filtersModalOpen}
      onRequestClose={onFiltersClose}
      boxStyle={styles.modal}
    >
      <TransparentScrollView>
        <ExpandableSection
          title={`${t('filters.userFilters')}${
            filteredUsers && filteredUsers.length > 0
              ? ` (${filteredUsers.length})`
              : ''
          }`}
        >
          <UserFilterSelector
            value={newFilteredUsers || []}
            onValueChange={onUsersValueChange}
          />
        </ExpandableSection>
        <ExpandableSection
          title={`${t('filters.categoryFilters')}${
            filteredCategories && filteredCategories.length > 0
              ? ` (${filteredCategories.length})`
              : ''
          }`}
        >
          <CategoryCheckboxes
            value={newFilteredCategories || []}
            onChange={setNewFilteredCategories}
          />
        </ExpandableSection>
        <ExpandableSection
          title={`${t('filters.taskTypeFilters')}${
            filteredTaskTypes && filteredTaskTypes.length > 0
              ? ` (${filteredTaskTypes.length})`
              : ''
          }`}
        >
          <TaskTypeSelector
            value={newFilteredTaskTypes || []}
            onValueChange={setNewFilteredTaskTypes}
          />
        </ExpandableSection>
        {user?.is_premium && (
          <ExpandableSection
            title={`${t('filters.completionFilters')}${
              completionFilters && completionFilters.length > 0
                ? ` (${completionFilters.length})`
                : ''
            }`}
          >
            <CompletionFilterSelector
              value={newCompletionFilters || []}
              onValueChange={setNewCompletionFilters}
            />
          </ExpandableSection>
        )}
      </TransparentScrollView>
      <TransparentView>
        <TransparentView style={styles.buttonWrapper}>
          <Button
            title={t('common.apply')}
            onPress={() => {
              if (newFilteredCategories) {
                dispatch(
                  setFilteredCategories({ categories: newFilteredCategories })
                );
              }
              if (newFilteredUsers) {
                dispatch(setFilteredUsers({ users: newFilteredUsers }));
              }
              if (newFilteredTaskTypes) {
                dispatch(
                  setFilteredTaskTypes({ taskTypes: newFilteredTaskTypes })
                );
              }
              if (newCompletionFilters) {
                dispatch(
                  setCompletionFilters({
                    completionFilters: newCompletionFilters
                  })
                );
              }
              onFiltersClose();
            }}
            style={styles.userFiltersApplyButton}
          />
        </TransparentView>
      </TransparentView>
    </Modal>
  );
}
