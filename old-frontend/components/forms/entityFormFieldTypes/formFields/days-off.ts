import { FormFieldTypes } from 'components/forms/formFieldTypes';
import { TFunction } from 'i18next';

export const daysOffForm = (isEdit: boolean, t: TFunction): FormFieldTypes => {
  return {
    name: {
      type: 'string',
      required: true,
      displayName: t('entities.entity.name')
    },
    description: {
      type: 'TextArea',
      required: false,
      displayName: t('entities.entity.description')
    },
    start_date: {
      type: 'Date',
      required: true,
      displayName: t('entities.trip.start_date'),
      associatedEndDateField: 'end_date'
    },
    end_date: {
      type: 'Date',
      required: true,
      displayName: t('entities.trip.end_date'),
      associatedStartDateField: 'start_date'
    },
    members: {
      type: 'addMembers',
      required: true,
      valueToDisplay: (val: any) => `${val.first_name} ${val.last_name}`,
      displayName: t('entities.entity.members'),
      changeMembersText: t('tasks.task.showOnWhoseCalendar')
    }
  };
};
