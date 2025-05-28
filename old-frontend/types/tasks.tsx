import { AlertName } from './alerts';
import { EntityTypeName, SchoolTermTypeName } from './entities';

type RecurrenceType =
  | 'DAILY'
  | 'WEEKLY'
  | 'WEEKDAILY'
  | 'MONTHLY'
  | 'MONTH_WEEKLY'
  | 'MONTHLY_LAST_WEEK'
  | 'YEARLY'
  | 'YEAR_MONTH_WEEKLY';

interface Recurrence {
  id: number;
  earliest_occurrence: string | null;
  latest_occurrence: string | null;
  interval_length: number;
  recurrence: RecurrenceType;
}

interface Reminder {
  id: number;
  timedelta: string;
}

type ScheduledTaskResourceType = 'FixedTask' | 'TaskAction';
type TaskResourceType =
  | 'FixedTask'
  | 'TransportTask'
  | 'AccommodationTask'
  | 'AnniversaryTask'
  | 'HolidayTask'
  | 'UserBirthdayTask'
  | 'BirthdayTask';
type ScheduledTaskType = 'TASK' | 'ACTION';
type TransportTaskType =
  | 'FLIGHT'
  | 'TRAIN'
  | 'RENTAL_CAR'
  | 'TAXI'
  | 'DRIVE_TIME';

type AccommodationTaskType = 'HOTEL' | 'STAY_WITH_FRIEND';
type ActivityTaskType = 'ACTIVITY' | 'OTHER_ACTIVITY' | 'FOOD_ACTIVITY';
type AnniversaryTaskType = 'ANNIVERSARY' | 'BIRTHDAY';
type TaskType =
  | 'TASK'
  | 'APPOINTMENT'
  | 'USER_BIRTHDAY'
  | 'DUE_DATE'
  | 'HOLIDAY'
  | 'ICAL_EVENT'
  | ActivityTaskType
  | TransportTaskType
  | AccommodationTaskType
  | AnniversaryTaskType;

interface BaseTaskType {
  entities: number[];
  id: number;
  location: string;
  polymorphic_ctype: number;
  resourcetype: TaskResourceType;
  title: string;
  hidden_tag: HiddenTagType;
  tags: string[];
  members: number[];
  recurrence?: Recurrence | null;
  recurrence_index?: number;
  reminders: Reminder[];
  routine: number | null;
  created_at: string;
  date?: string;
  duration?: number;
  start_datetime?: string;
  end_datetime?: string;
  start_timezone?: string;
  end_timezone?: string;
  start_date?: string;
  end_date?: string;
  type: TaskType;
}

interface FixedTaskResponseType extends BaseTaskType {}
interface AnniversaryTaskResponseType extends FixedTaskResponseType {
  known_year: boolean;
}
interface HolidayTaskResponseType extends FixedTaskResponseType {
  string_id: string;
  country_code: string;
  custom: boolean;
}

interface ICalEventResponseType extends FixedTaskResponseType {
  ical_integration: number;
}

const isAnniversaryTask = (
  task: FixedTaskResponseType
): task is AnniversaryTaskResponseType => {
  return Object.keys(task).includes('known_year');
};

const isHolidayTask = (
  task: FixedTaskResponseType
): task is HolidayTaskResponseType => {
  return Object.keys(task).includes('string_id');
};

const isICalEvent = (
  task: FixedTaskResponseType
): task is ICalEventResponseType => {
  return Object.keys(task).includes('ical_integration');
};

interface ScheduledTaskResponseType {
  id: number;
  is_complete: boolean;
  is_partially_complete: boolean;
  is_ignored: boolean;
  action_id: number | null;
  members: number[];
  entities: number[];
  tags: string[];
  recurrence: number | null;
  recurrence_index: number | null;
  routine: number | null;
  title: string;
  resourcetype: ScheduledTaskResourceType;
  type: TaskType;
  alert: AlertName[];
  date?: string;
  duration?: number;
  start_datetime?: string;
  end_datetime?: string;
  start_date?: string;
  end_date?: string;
}

interface ScheduledEntityResponseType {
  id: number;
  members: number[];
  title: string;
  resourcetype: EntityTypeName | SchoolTermTypeName;
  start_date: string | null;
  end_date: string | null;
  start_datetime: string | null;
  end_datetime: string | null;
  recurrence_index: number | null;
}

interface BaseCreateTaskRequest {
  title: string;
  members: number[];
  entities: number[];
  location?: string;
  reminders?: Omit<Reminder, 'id'>[];
  actions?: { action_timedelta: string }[];
  hidden_tag?: HiddenTagType;
  type?: TaskType;
}

interface CreateFixedTaskRequest extends BaseCreateTaskRequest {
  start_datetime?: string;
  end_datetime?: string;
  start_date?: string;
  end_date?: string;
  date?: string;
  duration?: number;
  resourcetype: TaskResourceType;
}

interface CreateFlexibleFixedTaskRequest extends BaseCreateTaskRequest {
  earliest_action_date: string;
  due_date: string;
  duration: number;
}

interface CreateRecurrentTaskOverwriteRequest {
  task: CreateFixedTaskRequest | null;
  recurrence: number;
  recurrence_index: number;
  baseTaskId: number;
  change_datetime?: string;
}

type CreateTaskRequest =
  | CreateFixedTaskRequest
  | CreateFlexibleFixedTaskRequest;

type HiddenTagType =
  | 'MOT_DUE'
  | 'INSURANCE_DUE'
  | 'WARRANTY_DUE'
  | 'SERVICE_DUE'
  | 'TAX_DUE';

type SchoolTermItemType =
  | 'SCHOOL_TERM'
  | 'SCHOOL_TERM_START'
  | 'SCHOOL_TERM_END'
  | 'SCHOOL_BREAK'
  | 'SCHOOL_YEAR_START'
  | 'SCHOOL_YEAR_END';

type MinimalScheduledTask = {
  id: number;
  recurrence_index: number | null;
  action_id: number | null;
  type: ScheduledTaskType | SchoolTermItemType | 'ROUTINE' | 'ENTITY';
};

type ScheduledTask = MinimalScheduledTask & {
  start_datetime?: string;
  end_datetime?: string;
  date?: string;
  duration?: number;
  routine?: number | null;
};

export {
  TransportTaskType,
  AccommodationTaskType,
  AnniversaryTaskType,
  ActivityTaskType,
  TaskType,
  ScheduledTaskResourceType,
  ScheduledTaskType,
  RecurrenceType,
  Recurrence,
  Reminder,
  FixedTaskResponseType,
  AnniversaryTaskResponseType,
  HolidayTaskResponseType,
  ICalEventResponseType,
  CreateTaskRequest,
  CreateFixedTaskRequest,
  CreateFlexibleFixedTaskRequest,
  CreateRecurrentTaskOverwriteRequest,
  ScheduledTaskResponseType,
  ScheduledEntityResponseType,
  HiddenTagType,
  SchoolTermItemType,
  MinimalScheduledTask,
  ScheduledTask,
  isAnniversaryTask,
  isHolidayTask,
  isICalEvent
};
