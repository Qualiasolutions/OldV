export type TimeBlock = {
  id: number;
  start_time: string;
  end_time: string;
  day: number;
  members: number[];
};

export type AllTimeBlocks = {
  ids: number[];
  byId: {
    [key: number]: TimeBlock;
  };
};
