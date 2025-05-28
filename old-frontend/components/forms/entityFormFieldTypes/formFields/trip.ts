import { FormFieldTypes } from 'components/forms/formFieldTypes';
import { TFunction } from 'i18next';

export const tripForm = (isEdit: boolean, t: TFunction): FormFieldTypes => {
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
      displayName: t('entities.entity.members')
    }
  };
};
