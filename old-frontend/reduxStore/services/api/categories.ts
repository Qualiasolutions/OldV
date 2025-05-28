import { AllCategories } from './types';
import {
  AllProfessionalCategories,
  Category,
  ProfessionalCategory
} from 'types/categories';
import { normalizeData, vuetApi } from './api';

const normalizeCategoryData = (data: { id: number; name: string }[]) => {
  return {
    ids: data.map(({ id }) => id),
    byId: data.reduce(
      (prev, next) => ({
        ...prev,
        [next.id]: next
      }),
      {}
    ),
    byName: data.reduce(
      (prev, next) => ({
        ...prev,
        [next.name]: next
      }),
      {}
    )
  };
};

const categoriesApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllCategories: builder.query<AllCategories, void>({
      query: () => ({
        url: 'core/category/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: Category[] = await response.json();
            return normalizeCategoryData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['Category']
    }),
    getAllProfessionalCategories: builder.query<
      AllProfessionalCategories,
      void
    >({
      query: () => ({
        url: 'core/professional-category/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: Category[] = await response.json();
            return normalizeData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['ProfessionalCategory']
    }),
    createProfessionalCategory: builder.mutation<
      ProfessionalCategory,
      Omit<ProfessionalCategory, 'id'>
    >({
      query: (body) => ({
        url: 'core/professional-category/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['ProfessionalCategory']
    }),
    updateProfessionalCategory: builder.mutation<
      ProfessionalCategory,
      Partial<ProfessionalCategory> & { id: number }
    >({
      query: (body) => ({
        url: `core/professional-category/${body.id}/`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['ProfessionalCategory']
    }),
    deleteProfessionalCategory: builder.mutation<void, number>({
      query: (categoryId) => ({
        url: `core/professional-category/${categoryId}/`,
        method: 'DELETE'
      }),
      invalidatesTags: ['ProfessionalCategory', 'Entity']
    })
  }),
  overrideExisting: true
});

export default categoriesApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllCategoriesQuery,
  useGetAllProfessionalCategoriesQuery,
  useCreateProfessionalCategoryMutation,
  useUpdateProfessionalCategoryMutation,
  useDeleteProfessionalCategoryMutation
} = categoriesApi;
