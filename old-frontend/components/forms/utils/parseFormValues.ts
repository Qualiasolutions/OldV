import dayjs from 'dayjs';
import {
  DateTimeField,
  FlatFormFieldTypes,
  OptionalYearDate
} from '../formFieldTypes';
import { FieldValueTypes } from '../types';
import isFieldShown from './isFieldShown';

const parseFormValues = (
  formValues: FieldValueTypes,
  fields: FlatFormFieldTypes
) => {
  const parsedFormValues: FieldValueTypes = {};
  for (const fieldName in formValues) {
    if (isFieldShown(fields[fieldName], formValues)) {
      parsedFormValues[fieldName] = formValues[fieldName];
    }
  }

  for (const field in parsedFormValues) {
    if (['DateTime'].includes(fields[field]?.type)) {
      if (parsedFormValues[field]) {
        const f = fields[field] as DateTimeField;
        if (f.utc) {
          parsedFormValues[field] =
            dayjs(parsedFormValues[field]).format('YYYY-MM-DDTHH:mm:ss') + 'Z';
        } else {
          parsedFormValues[field] = parsedFormValues[field].toISOString();
        }
      } else {
        delete parsedFormValues[field];
      }
    }
    if (['Date', 'OptionalYearDate'].includes(fields[field]?.type)) {
      if (parsedFormValues[field]) {
        parsedFormValues[field] = dayjs(parsedFormValues[field]).format(
          'YYYY-MM-DD'
        );
      } else {
        delete parsedFormValues[field];
      }
    }
    if (['Image'].includes(fields[field]?.type)) {
      // Delete if the image is provided as a string
      if (
        parsedFormValues[field] &&
        typeof parsedFormValues[field] === 'string'
      ) {
        delete parsedFormValues[field];
      }
    }

    if (['tagSelector'].includes(fields[field]?.type)) {
      parsedFormValues.entities = parsedFormValues[field].entities;
      parsedFormValues.tags = parsedFormValues[field].tags;
    }

    if (['OptionalYearDate'].includes(fields[field]?.type)) {
      const f = fields[field] as OptionalYearDate;
      if (f.knownYearField) {
        parsedFormValues[f.knownYearField] = !!formValues[f.knownYearField];
      }
    }
  }

  const postParsedFields: FieldValueTypes = {};
  for (const fieldName in parsedFormValues) {
    const targetField = fields[fieldName]?.targetField || fieldName;
    postParsedFields[targetField] = parsedFormValues[fieldName];
  }

  return postParsedFields;
};

export const parseFormDataFormValues = (
  formValues: FieldValueTypes,
  fields: FlatFormFieldTypes
) => {
  const parsedFormValues = parseFormValues(formValues, fields);
  const data = new FormData();
  for (const [fieldName, fieldValue] of Object.entries(parsedFormValues)) {
    if (typeof fieldValue === 'object' && fieldValue.length !== undefined) {
      // If the value is an array then it must be treated as such
      for (const val of fieldValue) {
        data.append(fieldName, val);
      }
    } else {
      data.append(fieldName, fieldValue as any);
    }
  }

  return data;
};

export default parseFormValues;
