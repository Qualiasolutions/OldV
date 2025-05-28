export type CreateContactMessageRequest = {
  email: string;
  message: string;
};

export type CreateContactMessageResponse = CreateContactMessageRequest & {
  id: number;
};
