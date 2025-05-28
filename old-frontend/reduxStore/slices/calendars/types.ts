import { TaskType } from 'types/tasks';

type TaskOrAction = {
  taskId: number;
  recurrenceIndex: number | null;
  actionId: number | null;
};
export interface CalendarState {
  data: {
    filteredUsers: number[];
    filteredEntities: number[];
    filteredTags: string[];
    filteredCategories: number[];
    filteredTaskTypes: (TaskType | 'OTHER')[];
    completionFilters: ('COMPLETE' | 'INCOMPLETE')[];
    taskToAction: TaskOrAction | null;
    taskToPartiallyComplete: TaskOrAction | null;
    taskToReschedule: TaskOrAction | null;
  };
  ui: {
    filtersModalOpen: boolean;
    enforcedDate: string;
    actionDrawerOpen: boolean;
    lastUpdateId: null | string;
  };
}
