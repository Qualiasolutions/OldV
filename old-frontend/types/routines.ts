export type Routine = {
  id: number;
  name: string;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
  start_time: string;
  end_time: string;
  members: number[];
};

export type AllRoutines = {
  ids: number[];
  byId: {
    [key: number]: Routine;
  };
};
