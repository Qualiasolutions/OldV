export type TaskLimitInterval = 'MONTHLY' | 'DAILY';

export interface TaskLimitLimitFields {
  minutes_limit: number | null;
  tasks_limit: number | null;
}
export type TaskLimitResponseType = TaskLimitLimitFields & {
  id: number;
  category: number;
  user: number;
  interval: TaskLimitInterval;
};

export type AllTaskLimits = {
  ids: number[];
  byId: {
    [id: number]: TaskLimitResponseType;
  };
};
