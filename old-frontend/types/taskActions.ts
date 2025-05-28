export type TaskAction = {
  id: number;
  task: number;
  action_timedelta: string;
};

export type AllTaskActions = {
  ids: number[];
  byId: {
    [key: number]: TaskAction;
  };
};
