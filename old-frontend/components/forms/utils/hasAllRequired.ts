import { FlatFormFieldTypes } from '../formFieldTypes';
import { FieldValueTypes } from '../types';
import isFieldShown from './isFieldShown';

const hasAllRequired = (
  formValues: FieldValueTypes,
  fields: FlatFormFieldTypes
) => {
  const parsedFormValues = { ...formValues };
  for (const field in fields) {
    const f = fields[field];

    if (!f?.required) {
      continue;
    }

    if (!isFieldShown(f, formValues)) {
      continue;
    }

    if (['addMembers'].includes(f?.type)) {
      const value = parsedFormValues[field];
      if (value && value.length > 0) {
        continue;
      }
      return false;
    }

    if (['tagSelector'].includes(f?.type)) {
      const value = parsedFormValues[field];
      if (
        value &&
        ((value.entities && value.entities.length > 0) ||
          (value.tags && value.tags.length > 0))
      ) {
        continue;
      }
      return false;
    }

    const value = parsedFormValues[field];
    if (!value) {
      return false;
    }
  }

  return true;
};

export default hasAllRequired;
