import { vuetApi } from './api';
import {
  AuthDetails,
  CreateUserInviteRequest,
  FormUpdateUserRequest,
  UpdateUserInviteRequest,
  UpdateUserRequest,
  UserInviteResponse,
  UserResponse,
  UserFullResponse,
  SecureUpdateUserRequest,
  CategorySetupCompletion,
  ReferencesSetupCompletion,
  EntityTypeSetupCompletion,
  TagSetupCompletion,
  LinkListSetupCompletion,
  LastActivityView,
  UserMinimalResponse
} from 'types/users';
import { DeleteRequest } from 'types/apiBase';

const userApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserFullDetails: builder.query<UserFullResponse, number>({
      query: (user_id) => ({
        url: `core/user/${user_id}/`
      }),
      providesTags: ['User']
    }),
    getUserMinimalDetails: builder.query<UserMinimalResponse, string>({
      query: (phone_number) => ({
        url: `core/user-minimal/${phone_number}/`
      }),
      providesTags: ['User']
    }),
    getUserMinimalDetailsFromId: builder.query<UserMinimalResponse, number>({
      query: (userId) => ({
        url: `core/user-id-minimal/${userId}/`
      }),
      providesTags: ['User']
    }),
    getUserDetails: builder.query<AuthDetails, void>({
      query: () => ({
        url: 'auth/details/'
      }),
      providesTags: ['User']
    }),
    updateUserDetails: builder.mutation<UserResponse, UpdateUserRequest>({
      query: (body) => ({
        url: `core/user-simple/${body.user_id}/`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['User']
    }),
    secureUpdateUserDetails: builder.mutation<
      UserResponse,
      SecureUpdateUserRequest
    >({
      query: (body) => ({
        url: `core/user-secure-update/${body.user_id}/`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['User']
    }),
    formUpdateUserDetails: builder.mutation<
      UserResponse,
      FormUpdateUserRequest
    >({
      query: (payload) => ({
        url: `core/user-simple/${payload.userId}/`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'multipart/form-data;'
        },
        body: payload.formData
      }),
      invalidatesTags: ['Family', 'User']
    }),
    getUserInvites: builder.query<UserInviteResponse[], void>({
      query: () => ({
        url: 'core/full-user-invite/'
      }),
      providesTags: ['UserInvite']
    }),
    createUserInvite: builder.mutation<
      UserInviteResponse,
      CreateUserInviteRequest
    >({
      query: (body) => ({
        url: 'core/user-invite/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['UserInvite']
    }),
    updateUserInvite: builder.mutation<
      UserInviteResponse,
      UpdateUserInviteRequest
    >({
      query: (body) => ({
        url: `core/user-invite/${body.id}/`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['UserInvite']
    }),
    deleteUserInvite: builder.mutation<null, DeleteRequest>({
      query: (body) => ({
        url: `core/user-invite/${body.id}/`,
        method: 'DELETE',
        body
      }),
      invalidatesTags: ['UserInvite']
    }),
    getCategorySetupCompletions: builder.query<CategorySetupCompletion[], void>(
      {
        query: () => ({
          url: `core/category-setup/`
        }),
        providesTags: ['CategorySetupCompletion']
      }
    ),
    createCategorySetupCompletion: builder.mutation<
      CategorySetupCompletion,
      { category: number; user: number }
    >({
      query: (body) => ({
        url: 'core/category-setup/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['CategorySetupCompletion']
    }),
    getReferencesSetupCompletions: builder.query<
      ReferencesSetupCompletion[],
      void
    >({
      query: () => ({
        url: `core/references-setup/`
      }),
      providesTags: ['ReferencesSetupCompletion']
    }),
    createReferencesSetupCompletion: builder.mutation<
      ReferencesSetupCompletion,
      { user: number }
    >({
      query: (body) => ({
        url: 'core/references-setup/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['ReferencesSetupCompletion']
    }),
    getEntityTypeSetupCompletions: builder.query<
      EntityTypeSetupCompletion[],
      void
    >({
      query: () => ({
        url: `core/entity-type-setup/`
      }),
      providesTags: ['EntityTypeSetupCompletion']
    }),
    createEntityTypeSetupCompletion: builder.mutation<
      EntityTypeSetupCompletion,
      { entity_type: string; user: number }
    >({
      query: (body) => ({
        url: 'core/entity-type-setup/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['EntityTypeSetupCompletion']
    }),
    getTagSetupCompletions: builder.query<TagSetupCompletion[], void>({
      query: () => ({
        url: `core/tag-setup/`
      }),
      providesTags: ['TagSetupCompletion']
    }),
    createTagSetupCompletion: builder.mutation<
      TagSetupCompletion,
      { tag_name: string; user: number }
    >({
      query: (body) => ({
        url: 'core/tag-setup/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['TagSetupCompletion']
    }),
    getLinkListCompletions: builder.query<LinkListSetupCompletion[], void>({
      query: () => ({
        url: `core/link-list-setup/`
      }),
      providesTags: ['LinkListSetupCompletion']
    }),
    createLinkListSetupCompletion: builder.mutation<
      LinkListSetupCompletion,
      { list_name: string; user: number }
    >({
      query: (body) => ({
        url: 'core/link-list-setup/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['LinkListSetupCompletion']
    }),
    getLastActivityView: builder.query<LastActivityView | null, void>({
      query: () => ({
        url: `core/last-activity-view/`,
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: LastActivityView[] = await response.json();
            return responseJson[0] || null;
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['LastActivityView']
    }),
    updateLastActivityView: builder.mutation<LastActivityView, { id: number }>({
      query: ({ id: lastActivityId }) => ({
        url: `core/last-activity-view/${lastActivityId}/`,
        method: 'PATCH'
      }),
      invalidatesTags: ['LastActivityView']
    }),
    createLastActivityView: builder.mutation<
      LastActivityView,
      { user: number }
    >({
      query: (body) => ({
        url: `core/last-activity-view/`,
        method: 'POST',
        body
      }),
      invalidatesTags: ['LastActivityView']
    })
  }),
  overrideExisting: true
});

export const {
  useGetUserFullDetailsQuery,
  useGetUserDetailsQuery,
  useUpdateUserDetailsMutation,
  useSecureUpdateUserDetailsMutation,
  useFormUpdateUserDetailsMutation,
  useGetUserInvitesQuery,
  useCreateUserInviteMutation,
  useUpdateUserInviteMutation,
  useDeleteUserInviteMutation,
  useGetCategorySetupCompletionsQuery,
  useCreateCategorySetupCompletionMutation,
  useGetUserMinimalDetailsQuery,
  useLazyGetUserMinimalDetailsQuery,
  useGetUserMinimalDetailsFromIdQuery,
  useGetReferencesSetupCompletionsQuery,
  useCreateReferencesSetupCompletionMutation,
  useGetEntityTypeSetupCompletionsQuery,
  useCreateEntityTypeSetupCompletionMutation,
  useGetTagSetupCompletionsQuery,
  useCreateTagSetupCompletionMutation,
  useGetLinkListCompletionsQuery,
  useCreateLinkListSetupCompletionMutation,
  useGetLastActivityViewQuery,
  useUpdateLastActivityViewMutation,
  useCreateLastActivityViewMutation
} = userApi;

export default userApi;
