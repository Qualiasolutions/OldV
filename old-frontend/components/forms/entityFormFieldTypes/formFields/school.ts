import { FormFieldTypes } from 'components/forms/formFieldTypes';
import { TFunction } from 'i18next';

export const schoolForm = (isEdit: boolean, t: TFunction): FormFieldTypes => {
  return {
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
    address: {
      type: 'TextArea',
      required: false,
      displayName: t('entities.school.address')
    },
    phone_number: {
      type: 'phoneNumber',
      required: false,
      displayName: t('entities.school.phone_number')
    },
    email: {
      type: 'string',
      required: false,
      displayName: t('entities.school.email')
    },
    notes: {
      type: 'TextArea',
      required: false,
      displayName: t('entities.entity.notes')
    },
    members: {
      type: 'addMembers',
      required: true,
      valueToDisplay: (val: any) => `${val.first_name} ${val.last_name}`,
      displayName: t('entities.career-goal.members')
    }
  };
};
