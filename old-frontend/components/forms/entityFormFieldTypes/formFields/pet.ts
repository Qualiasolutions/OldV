import { FormFieldTypes } from 'components/forms/formFieldTypes';
import { TFunction } from 'i18next';

export const petForm = (isEdit: boolean, t: TFunction): FormFieldTypes => {
  return {
    name: {
      type: 'string',
      required: true,
      displayName: t('entities.pet.name')
    },
    type: {
      type: 'dropDownWithOther',
      required: true,
      displayName: t('entities.pet.type'),
      permittedValues: [
        { label: 'Dog', value: 'Dog' },
        { label: 'Cat', value: 'Cat' },
        { label: 'Bird', value: 'Bird' }
      ],
      listMode: 'MODAL'
    },
    breed: {
      type: 'string',
      required: true,
      displayName: t('entities.pet.breed')
    },
    dob: {
      type: 'Date',
      required: true,
      displayName: t('entities.pet.dob')
    },
    image: {
      type: 'Image',
      required: false,
      displayName: t('entities.entity.image'),
      sourceField: 'presigned_image_url'
    },
    members: {
      type: 'addMembers',
      required: true,
      valueToDisplay: (val: any) => `${val.first_name} ${val.last_name}`,
      displayName: t('entities.entity.members')
    }
  };
};
