export type PasswordResetRequest = {
  email?: string;
  phone_number?: string;
};

export type ValidatePasswordResetCodeRequest = {
  email?: string;
  phone_number?: string;
  code: string;
};
