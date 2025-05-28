import {
  PasswordResetRequest,
  ValidatePasswordResetCodeRequest
} from 'types/auth';
import { vuetApi } from './api';

const authApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    createPasswordResetCode: builder.mutation<void, PasswordResetRequest>({
      query: (body) => ({
        url: 'auth/password-reset-code/',
        method: 'POST',
        body,
        responseHandler: async (response) => {
          if (response.ok) {
            return response.json();
          } else {
            // Just return the error data
            return response.json();
          }
        }
      })
    }),
    validatePasswordResetCode: builder.mutation<
      { success: boolean; user: number },
      ValidatePasswordResetCodeRequest
    >({
      query: (body) => ({
        url: 'auth/validate-password-reset-code/',
        method: 'POST',
        body,
        responseHandler: async (response) => {
          if (response.ok) {
            return response.json();
          } else {
            // Just return the error data
            return response.json();
          }
        }
      })
    })
  }),
  overrideExisting: true
});

export default authApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useCreatePasswordResetCodeMutation,
  useValidatePasswordResetCodeMutation
} = authApi;
