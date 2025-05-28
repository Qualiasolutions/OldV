import { FormFieldTypes } from 'components/forms/formFieldTypes';
import { TFunction } from 'i18next';
import { AllProfessionalCategories } from 'types/categories';

export const professionalEntityForm = (
  isEdit: boolean,
  allCategories: AllProfessionalCategories,
  t: TFunction
): FormFieldTypes => {
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
    },
    professional_category: {
      // TODO
      type: 'dropDown',
      required: true,
      displayName: 'Category',
      permittedValues: Object.values(allCategories.byId).map((category) => ({
        label: category.name,
        value: category.id
      })),
      listMode: 'MODAL'
    }
  };
};
