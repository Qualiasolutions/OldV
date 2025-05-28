import { FetchBaseQueryError } from '@reduxjs/toolkit/dist/query';

export type CreatePhoneValidationRequest = {
  phone_number: string;
};

export type UpdatePhoneValidationRequest = {
  id: number;
  code: string;
};

export type PhoneValidationResponse = {
  id: number;
  phone_number: string;
  validated: boolean;
  created_at: string;
};

export type CreateEmailValidationRequest = {
  email: string;
};

export type UpdateEmailValidationRequest = {
  id: number;
  code: string;
};

export type EmailValidationResponse = {
  id: number;
  email: string;
  validated: boolean;
  created_at: string;
};

export type RegisterAccountRequest = {
  password: string;
  password2: string;
  phone_number?: string;
  email?: string;
};

export type RegisterAccountResponse = {
  phone_number: string;
  access_token: string;
  refresh_token: string;
};

export function isInvalidEmailError(error: unknown): error is {
  data: {
    email_address: string[];
  };
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof ((error as any).data as any) === 'object' &&
    typeof ((error as any).data as any).email === 'object' &&
    ['Enter a valid email address.'].includes(
      (((error as any).data as any).email as any)['0']
    )
  );
}

export function isInvalidPhoneNumberError(error: unknown): error is {
  data: {
    phone_number: [
      'Enter a valid phone number.' | 'The phone number entered is not valid.'
    ];
  };
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof ((error as any).data as any) === 'object' &&
    typeof ((error as any).data as any).phone_number === 'object' &&
    [
      'Enter a valid phone number.',
      'The phone number entered is not valid.'
    ].includes((((error as any).data as any).phone_number as any)['0'])
  );
}

export function isTakenPhoneNumberError(
  error: unknown
): error is { data: { phone_number: { code: 'phone_number_used' } } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof ((error as any).data as any) === 'object' &&
    typeof ((error as any).data as any).phone_number === 'object' &&
    (((error as any).data as any).phone_number as any).code ===
      'phone_number_used'
  );
}

export function isTakenEmailError(
  error: unknown
): error is { data: { email: { code: 'email_used' } } } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'data' in error &&
    typeof ((error as any).data as any) === 'object' &&
    typeof ((error as any).data as any).email === 'object' &&
    (((error as any).data as any).email as any).code === 'email_used'
  );
}

/*
This helper function produces type-checking functions which return true if the
fieldName field has an error of code errorCode. i.e. if the error returned is
of the form:

{
  data: {
    [fieldName]: {
      code: errorCode,
      ...
    }
  },
  ...
}
*/
export function isFieldErrorCodeError(
  fieldName: string,
  errorCode: string
): (error: any) => boolean {
  return (error) => {
    return (
      typeof error === 'object' &&
      error !== null &&
      'data' in error &&
      typeof (error as any).data === 'object' &&
      typeof ((error as any).data as any) === 'object' &&
      typeof ((error as any).data as any)[fieldName] === 'object' &&
      (((error as any).data as any)[fieldName] as any).code === errorCode
    );
  };
}
