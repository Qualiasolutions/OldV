export type CreatePushTokenRequest = {
  token: string;
};

export type UpdatePushTokenRequest = {
  id: number;
  active?: boolean;
};

export type PushTokenResponse = {
  id: number;
  token: string;
  user: number;
  active: boolean;
};
