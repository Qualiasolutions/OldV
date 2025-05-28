import {
  FlatFormFieldTypes,
  FormFieldTypes
} from 'components/forms/formFieldTypes';
import { TFunction } from 'i18next';
import dueDateMembershipField from '../utils/dueDateMembershipField';
import reminderDropDownField from '../utils/reminderDropDownField';

export const boatForm = (isEdit: boolean, t: TFunction): FormFieldTypes => {
  const fields: FlatFormFieldTypes[] = [
    {
      image: {
        type: 'Image',
        required: false,
        displayName: t('entities.entity.image'),
        sourceField: 'presigned_image_url'
      },
      name: {
        type: 'string',
        required: true,
        displayName: t('entities.entity.name')
      },
      make: {
        type: 'string',
        required: true,
        displayName: t('entities.car.make')
      },
      model: {
        type: 'string',
        required: false,
        displayName: t('entities.car.model')
      },
      registration: {
        type: 'string',
        required: false,
        displayName: t('entities.car.registration'),
        transform: 'uppercase'
      },
      date_registered: {
        type: 'Date',
        required: false,
        displayName: t('entities.car.date_registered')
      },
      members: {
        type: 'addMembers',
        required: true,
        valueToDisplay: (val: any) => `${val.first_name} ${val.last_name}`,
        displayName: t('entities.entity.members')
      }
    },
    {
      vehicle_type: {
        type: 'dropDown',
        permittedValues: [
          {
            label: 'Boat',
            value: 'BOAT'
          },
          {
            label: 'Other',
            value: 'OTHER'
          }
        ],
        required: true,
        displayName: t('entities.car.vehicle_type'),
        listMode: 'MODAL'
      }
    }
  ];

  const createFields: FlatFormFieldTypes[] = [
    {
      service_due_date: {
        type: 'Date',
        required: false,
        displayName: t('entities.car.service_due_date'),
        hidden: isEdit
      },
      service_reminder_interval: reminderDropDownField(
        'service_due_date',
        t('entities.entity.reminder'),
        isEdit
      ),
      service_due_date_members: dueDateMembershipField(
        'service_due_date',
        isEdit,
        t('entities.entity.taskMembers'),
        t('tasks.task.changeMembers')
      )
    },
    {
      insurance_due_date: {
        type: 'Date',
        required: false,
        displayName: t('entities.car.insurance_due_date'),
        hidden: isEdit
      },
      insurance_reminder_interval: reminderDropDownField(
        'insurance_due_date',
        t('entities.entity.reminder'),
        isEdit
      ),
      insurance_due_date_members: dueDateMembershipField(
        'insurance_due_date',
        isEdit,
        t('entities.entity.taskMembers'),
        t('tasks.task.changeMembers')
      )
    }
  ];

  if (!isEdit) {
    return [...fields, ...createFields];
  }

  return fields;
};
