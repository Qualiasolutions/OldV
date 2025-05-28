import {
  CreateContactMessageRequest,
  CreateContactMessageResponse
} from 'types/contact';
import { vuetApi } from './api';

const contactApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    createContactMessage: builder.mutation<
      CreateContactMessageResponse,
      CreateContactMessageRequest
    >({
      query: (body) => {
        return {
          url: `contact/message/`,
          method: 'POST',
          body
        };
      }
    })
  }),
  overrideExisting: true
});

export default contactApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useCreateContactMessageMutation } = contactApi;
