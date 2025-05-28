import { Subscription } from 'types/subscriptions';
import { vuetApi } from './api';

const subscriptionsApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllSubscriptions: builder.query<Subscription[], number>({
      query: (user_id) => ({
        url: `subscriptions/get-subscriptions/?user_id=${user_id}`,
        responseHandler: async (response) => {
          if (response.ok) {
            return response.json();
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['Subscription']
    })
  }),
  overrideExisting: true
});

export default subscriptionsApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetAllSubscriptionsQuery } = subscriptionsApi;
