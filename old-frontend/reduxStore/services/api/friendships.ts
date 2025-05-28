import { vuetApi } from './api';
import {
  FriendshipDeleteRequest,
  FriendshipRequest,
  FriendshipResponse
} from 'types/users';

const extendedApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    createFriendship: builder.mutation<FriendshipResponse, FriendshipRequest>({
      query: (payload) => ({
        url: 'core/friendship/',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['User', 'Friendships']
    }),
    deleteFriendship: builder.mutation<null, FriendshipDeleteRequest>({
      query: (payload) => ({
        url: `core/friendship/${payload.id}/`,
        method: 'DELETE'
      }),
      invalidatesTags: ['User', 'Friendships', 'UserInvite']
    }),
    getAllFriendships: builder.query<FriendshipResponse[], number>({
      query: (payload) => ({
        url: 'core/friendship/',
        method: 'GET'
      }),
      providesTags: ['Friendships']
    })
  }),
  overrideExisting: true
});

export const {
  useCreateFriendshipMutation,
  useDeleteFriendshipMutation,
  useGetAllFriendshipsQuery
} = extendedApi;
