import { FormFieldTypes } from 'components/forms/formFieldTypes';
import { TFunction } from 'i18next';

export const defaultForm = (isEdit: boolean, t: TFunction): FormFieldTypes => {
  return {
    name: {
      type: 'string',
      required: true,
      displayName: t('entities.entity.name')
    },
    members: {
      type: 'addMembers',
      required: true,
      valueToDisplay: (val: any) => `${val.first_name} ${val.last_name}`,
      displayName: t('entities.entity.members')
    }
  };
};
