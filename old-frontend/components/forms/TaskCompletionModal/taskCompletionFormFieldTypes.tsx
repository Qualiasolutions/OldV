import useGetUserFullDetails from 'hooks/useGetUserDetails';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FixedTaskResponseType } from 'types/tasks';
import dueDateMembershipField from '../entityFormFieldTypes/utils/dueDateMembershipField';
import reminderDropDownField from '../entityFormFieldTypes/utils/reminderDropDownField';
import { useDueDateFieldTypes, useTaskFieldTypes } from '../taskFormFieldTypes';
import { FieldValueTypes } from '../types';

export default function useCompletionFormFieldTypes(
  task: FixedTaskResponseType | null
) {
  const { t: modelFieldTranslations } = useTranslation('modelFields');
  const { data: userFullDetails } = useGetUserFullDetails();

  const dueDateFields = useDueDateFieldTypes({});
  const taskFields = useTaskFieldTypes({});

  return useMemo(() => {
    if (!task) {
      return {} as FieldValueTypes;
    }

    if (!userFullDetails) {
      return {} as FieldValueTypes;
    }

    if (
      [
        'MOT_DUE',
        'INSURANCE_DUE',
        'SERVICE_DUE',
        'WARRANTY_DUE',
        'TAX_DUE'
      ].includes(task.hidden_tag)
    ) {
      return {
        date: {
          type: 'Date',
          required: true,
          displayName: modelFieldTranslations('tasks.task.date')
        },
        reminder_interval: reminderDropDownField(
          'date',
          modelFieldTranslations('entities.entity.reminder'),
          false
        ),
        members: dueDateMembershipField(
          'date',
          false,
          modelFieldTranslations('entities.entity.taskMembers'),
          modelFieldTranslations('tasks.task.changeMembers')
        )
      };
    }

    if (task.type === 'DUE_DATE' && !task.recurrence) {
      return dueDateFields;
    }

    if (task.type === 'TASK') {
      return taskFields;
    }

    if (task.type === 'APPOINTMENT') {
      return taskFields;
    }
  }, [
    userFullDetails,
    modelFieldTranslations,
    task,
    dueDateFields,
    taskFields
  ]);
}
