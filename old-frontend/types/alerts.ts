export type AlertName =
  | 'TASK_LIMIT_EXCEEDED'
  | 'TASK_CONFLICT'
  | 'BLOCKED_DAY'
  | 'UNPREFERRED_DAY';

export type Alert = {
  id: number;
  type: AlertName;
  user: number;
  task: number;
  read: boolean;
};

export type AllAlerts = {
  ids: number[];
  byId: {
    [key: number]: Alert;
  };
  byTask: {
    [key: number]: number[];
  };
};

export type ActionAlert = {
  id: number;
  type: AlertName;
  user: number;
  action: number;
  read: boolean;
};

export type AllActionAlerts = {
  ids: number[];
  byId: {
    [key: number]: ActionAlert;
  };
  byAction: {
    [key: number]: number[];
  };
};
