import { vuetApi } from './api';
import { FamilyResponse, UpdateFamilyRequest } from 'types/families';

const extendedApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    updateFamilyDetails: builder.mutation<FamilyResponse, UpdateFamilyRequest>({
      query: (payload) => {
        return {
          url: `core/family/${payload.familyId}/`,
          method: 'PATCH',
          headers: {
            'Content-Type': 'multipart/form-data;'
          },
          body: payload.formData
        };
      },
      invalidatesTags: ['Family', 'User']
    })
  }),
  overrideExisting: true
});

export const { useUpdateFamilyDetailsMutation } = extendedApi;
