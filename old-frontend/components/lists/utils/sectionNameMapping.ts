import { EntityResponseType } from 'types/entities';
import {
  getUTCValuesFromDateString,
  getUTCValuesFromDateTimeString
} from 'utils/datesAndTimes';

const getMonthFromDateField = (
  entity: EntityResponseType,
  fieldName: string
) => {
  const { monthName } = getUTCValuesFromDateString(entity[fieldName]);
  return monthName;
};

const getMonthAndYearFromDateField = (
  entity: EntityResponseType,
  fieldName: string
) => {
  const { monthName, year } = getUTCValuesFromDateString(entity[fieldName]);
  return `${monthName} ${year}`;
};

const getMonthAndYearFromDateTimeField = (
  entity: EntityResponseType,
  fieldName: string
) => {
  const { monthName, year } = getUTCValuesFromDateTimeString(entity[fieldName]);
  return `${monthName} ${year}`;
};

const getNextMonthAndYearFromDateField = (
  entity: EntityResponseType,
  fieldName: string
) => {
  const now = new Date();
  const { monthName, month, day, year } = getUTCValuesFromDateString(
    entity[fieldName]
  );
  const currentYear = now.getFullYear();
  if (
    now.getMonth() < month ||
    (now.getMonth() == month && now.getDate() <= day)
  ) {
    return `${monthName} ${currentYear}`;
  }
  return `${monthName} ${currentYear + 1}`;
};

export const sectionNameMapping = {
  Birthday: (entity: EntityResponseType) =>
    getNextMonthAndYearFromDateField(entity, 'start_date'),
  Anniversary: (entity: EntityResponseType) =>
    getNextMonthAndYearFromDateField(entity, 'start_date'),
  Holiday: (entity: EntityResponseType) =>
    getMonthAndYearFromDateField(entity, 'start_date'),
  Event: (entity: EntityResponseType) =>
    getMonthAndYearFromDateTimeField(entity, 'start_datetime'),
  DaysOff: (entity: EntityResponseType) =>
    getMonthAndYearFromDateField(entity, 'start_date'),
  Trip: (entity: EntityResponseType) =>
    getMonthAndYearFromDateField(entity, 'start_date'),
  SchoolBreak: (entity: EntityResponseType) =>
    getMonthAndYearFromDateField(entity, 'start_date')
} as { [key: string]: ((entity: EntityResponseType) => string) | undefined };
