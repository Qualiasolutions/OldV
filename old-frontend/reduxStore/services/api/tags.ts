import { AllTags } from 'types/tags';
import { vuetApi } from './api';

const tagsApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTags: builder.query<AllTags, void>({
      query: () => ({
        url: 'core/tags/',
        responseHandler: async (response) => {
          if (response.ok) {
            return response.json();
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['Tag']
    })
  }),
  overrideExisting: true
});

export default tagsApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useGetAllTagsQuery } = tagsApi;
