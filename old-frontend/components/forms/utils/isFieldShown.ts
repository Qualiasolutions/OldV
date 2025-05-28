import { Field } from '../formFieldTypes';

export default function isFieldShown(
  field: Field,
  formValues?: { [key: string]: any }
) {
  if (!field) {
    return false;
  }
  if (field.hidden) {
    return false;
  }

  if (field.shownFields && formValues) {
    for (const fieldConditions of field.shownFields) {
      let matchesAll = true;
      for (const dependentField in fieldConditions) {
        if (
          !(!!formValues[dependentField] === fieldConditions[dependentField])
        ) {
          matchesAll = false;
          break;
        }
      }
      if (matchesAll) {
        return true;
      }
    }
  } else {
    return true;
  }

  return false;
}
