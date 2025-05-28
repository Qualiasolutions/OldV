import {
  AccommodationTaskType,
  ActivityTaskType,
  AnniversaryTaskType,
  TaskType,
  TransportTaskType
} from 'types/tasks';

export const TRANSPORT_TASK_TYPES: { [key in TransportTaskType]: string } = {
  FLIGHT: 'Flight',
  TRAIN: 'Train',
  RENTAL_CAR: 'Rental Car',
  TAXI: 'Taxi',
  DRIVE_TIME: 'Drive Time'
};

export const ACCOMMODATION_TASK_TYPES: {
  [key in AccommodationTaskType]: string;
} = {
  HOTEL: 'Hotel',
  STAY_WITH_FRIEND: 'Stay With Friend'
};

export const ANNIVERSARY_TASK_TYPES: {
  [key in AnniversaryTaskType]: string;
} = {
  BIRTHDAY: 'Birthday',
  ANNIVERSARY: 'Anniversary'
};

export const ACTIVITY_TASK_TYPES: {
  [key in ActivityTaskType]: string;
} = {
  ACTIVITY: 'Activity',
  FOOD_ACTIVITY: 'Food Activity',
  OTHER_ACTIVITY: 'Other Activity'
};

export const isTransportTaskType = (val: string): val is TransportTaskType => {
  return val in TRANSPORT_TASK_TYPES;
};

export const isAccommodationTaskType = (
  val: string
): val is AccommodationTaskType => {
  return val in ACCOMMODATION_TASK_TYPES;
};

export const isAnniversaryTaskType = (
  val: string
): val is AnniversaryTaskType => {
  return val in ANNIVERSARY_TASK_TYPES;
};

export const isActivityTaskType = (val: string): val is ActivityTaskType => {
  return val in ACTIVITY_TASK_TYPES;
};

export const useFormType = (taskType: TaskType | '') => {
  if (!taskType) {
    return null;
  }
  if (isTransportTaskType(taskType)) {
    return 'TRANSPORT';
  }
  if (isAccommodationTaskType(taskType)) {
    return 'ACCOMMODATION';
  }
  if (isAnniversaryTaskType(taskType)) {
    return 'ANNIVERSARY';
  }
  if (isActivityTaskType(taskType)) {
    return 'ACTIVITY';
  }

  return taskType;
};
