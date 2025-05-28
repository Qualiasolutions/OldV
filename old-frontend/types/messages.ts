export type CreateMessageRequest = {
  text: string;
  user: number;
  task: number | null;
  entity: number | null;
  action: number | null;
  recurrence_index: number | null;
};

export type MessageResponse = CreateMessageRequest & {
  id: number;
  created_at: string;
  name: string;
};
