import { TaskType } from 'types/tasks';
import { createAction } from 'typesafe-actions';

export const setEnforcedDate = createAction('@calendars/setEnforcedDate')<{
  date: string;
}>();

export const setLastUpdateId = createAction(
  '@calendars/setLastUpdateId'
)<string>();

export const setFilteredUsers = createAction('@calendars/setFilteredUsers')<{
  users: number[];
}>();

export const setFilteredEntities = createAction(
  '@calendars/setFilteredEntities'
)<{
  entities: number[];
}>();

export const setFilteredTags = createAction('@calendars/setFilteredTags')<{
  tags: string[];
}>();

export const setFilteredCategories = createAction(
  '@calendars/setFilteredCategories'
)<{
  categories: number[];
}>();

export const setFilteredTaskTypes = createAction(
  '@calendars/setFilteredTaskTypes'
)<{
  taskTypes: (TaskType | 'OTHER')[];
}>();

export const setCompletionFilters = createAction(
  '@calendars/setCompletionFilters'
)<{
  completionFilters: ('COMPLETE' | 'INCOMPLETE')[];
}>();

export const setTaskToAction = createAction('@calendars/setTaskToAction')<{
  taskId: number;
  recurrenceIndex: number | null;
  actionId: number | null;
} | null>();

export const setTaskToPartiallyComplete = createAction(
  '@calendars/setTaskToPartiallyComplete'
)<{
  taskId: number;
  recurrenceIndex: number | null;
  actionId: number | null;
} | null>();

export const setTaskToReschedule = createAction(
  '@calendars/setTaskToReschedule'
)<{
  taskId: number;
  recurrenceIndex: number | null;
  actionId: number | null;
} | null>();

export const deselectTasks = createAction('@calendars/deselectTasks')();

export const setFiltersModalOpen = createAction(
  '@calendars/setFiltersModalOpen'
)<boolean>();
