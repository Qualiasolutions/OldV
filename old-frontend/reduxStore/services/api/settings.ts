import { vuetApi, normalizeData } from './api';
import {
  AllBlockedCategories,
  AllFamilyCategoryViewPermission,
  AllPreferredDays,
  BlockedCategories,
  BlockedCategoryType,
  FamilyCategoryViewPermission,
  PreferredDays
} from 'types/settings';

const extendedApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllFamilyCategoryViewPermissions: builder.query<
      AllFamilyCategoryViewPermission,
      void
    >({
      query: () => ({
        url: 'core/family-category-view-permissions/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: FamilyCategoryViewPermission[] =
              await response.json();
            return normalizeData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['FamilyCategoryViewPermission']
    }),
    updateFamilyCategoryViewPermission: builder.mutation<
      FamilyCategoryViewPermission,
      Partial<FamilyCategoryViewPermission> &
        Pick<FamilyCategoryViewPermission, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/family-category-view-permissions/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['FamilyCategoryViewPermission']
    }),
    createFamilyCategoryViewPermission: builder.mutation<
      FamilyCategoryViewPermission,
      Omit<FamilyCategoryViewPermission, 'id'>
    >({
      query: (body) => {
        return {
          url: 'core/family-category-view-permissions/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['FamilyCategoryViewPermission']
    }),
    deleteFamilyCategoryViewPermission: builder.mutation<
      FamilyCategoryViewPermission,
      Pick<FamilyCategoryViewPermission, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/family-category-view-permissions/${body.id}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['FamilyCategoryViewPermission']
    }),

    getAllPreferredDays: builder.query<AllPreferredDays, void>({
      query: () => ({
        url: 'core/preferred-days/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: PreferredDays[] = await response.json();
            return normalizeData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['PreferredDays']
    }),
    updatePreferredDays: builder.mutation<
      PreferredDays,
      Partial<PreferredDays> & Pick<PreferredDays, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/preferred-days/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['PreferredDays']
    }),
    createPreferredDays: builder.mutation<
      PreferredDays,
      Omit<PreferredDays, 'id'>
    >({
      query: (body) => {
        return {
          url: 'core/preferred-days/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['PreferredDays']
    }),
    deletePreferredDays: builder.mutation<
      PreferredDays,
      Pick<PreferredDays, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/preferred-days/${body.id}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['PreferredDays']
    }),
    getBlockedCategories: builder.query<
      AllBlockedCategories,
      BlockedCategoryType
    >({
      query: (type) => ({
        url: `core/blocked-days/${type}/`,
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: BlockedCategories[] = await response.json();
            return normalizeData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['BlockedCategories']
    }),
    deleteBlockedCategory: builder.mutation<
      BlockedCategories,
      { type: BlockedCategoryType } & Pick<BlockedCategories, 'id'>
    >({
      query: ({ type, id }) => ({
        url: `core/blocked-days/${type}/${id}/`,
        method: 'DELETE'
      }),
      invalidatesTags: ['BlockedCategories']
    }),
    createBlockedCategory: builder.mutation<
      BlockedCategories,
      { type: BlockedCategoryType } & Omit<BlockedCategories, 'id'>
    >({
      query: (body) => ({
        url: `core/blocked-days/${body.type}/`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['BlockedCategories']
    })
  }),
  overrideExisting: true
});

export default extendedApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllFamilyCategoryViewPermissionsQuery,
  useUpdateFamilyCategoryViewPermissionMutation,
  useDeleteFamilyCategoryViewPermissionMutation,
  useCreateFamilyCategoryViewPermissionMutation,
  useGetAllPreferredDaysQuery,
  useUpdatePreferredDaysMutation,
  useCreatePreferredDaysMutation,
  useDeletePreferredDaysMutation,
  useGetBlockedCategoriesQuery,
  useDeleteBlockedCategoryMutation,
  useCreateBlockedCategoryMutation
} = extendedApi;
