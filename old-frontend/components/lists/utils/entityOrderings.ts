import { EntityResponseType } from 'types/entities';
import dayjs from 'dayjs';

const orderByDateField = (fieldName: string) => {
  return (entity: EntityResponseType, otherEntity: EntityResponseType) => {
    if (dayjs(entity[fieldName]) < dayjs(otherEntity[fieldName])) {
      return -1;
    }
    return 1;
  };
};

const orderByDateFieldNoYear = (fieldName: string) => {
  return (entity: EntityResponseType, otherEntity: EntityResponseType) => {
    if (
      dayjs(entity.start_date).month() < dayjs(otherEntity.start_date).month()
    ) {
      return -1;
    }
    if (
      dayjs(entity.start_date).month() ===
        dayjs(otherEntity.start_date).month() &&
      dayjs(entity.start_date).date() < dayjs(otherEntity.start_date).date()
    ) {
      return -1;
    }
    return 1;
  };
};

export const entityOrderings = {
  Birthday: orderByDateFieldNoYear('start_date'),
  Anniversary: orderByDateFieldNoYear('start_date'),
  Event: orderByDateField('start_datetime'),
  Holiday: orderByDateField('start_date'),
  DaysOff: orderByDateField('start_date'),
  Trip: orderByDateField('start_date'),
  SchoolBreak: orderByDateField('start_date')
} as {
  [key: string]:
    | ((entity: EntityResponseType, otherEntity: EntityResponseType) => number)
    | undefined;
};
