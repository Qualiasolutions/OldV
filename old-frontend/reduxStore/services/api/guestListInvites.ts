import { vuetApi } from './api';
import {
  CreateGuestListInviteRequest,
  GuestListInvite,
  GuestListInviteeInvite
} from 'types/guestListInvites';

const guestListInvitesApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    createGuestListInvite: builder.mutation<
      GuestListInvite,
      CreateGuestListInviteRequest
    >({
      query: (payload) => ({
        url: 'core/guestlist-invite/',
        method: 'POST',
        body: payload
      }),
      invalidatesTags: ['GuestListInvite']
    }),
    deleteGuestListInvite: builder.mutation<null, number>({
      query: (id) => ({
        url: `core/guestlist-invite/${id}/`,
        method: 'DELETE'
      }),
      invalidatesTags: ['GuestListInvite']
    }),
    getGuestListInvites: builder.query<GuestListInvite[], void>({
      query: () => ({
        url: 'core/guestlist-invite/',
        method: 'GET'
      }),
      providesTags: ['GuestListInvite']
    }),
    sendGuestListInvite: builder.mutation<GuestListInvite, number>({
      query: (inviteId) => ({
        url: `core/guestlist-invite/${inviteId}/send/`,
        method: 'GET'
      }),
      invalidatesTags: ['GuestListInvite']
    }),
    sendGuestListInvitesForEntity: builder.mutation<GuestListInvite, number>({
      query: (entityId) => ({
        url: `core/guestlist-invite/${entityId}/send_for_entity/`,
        method: 'GET'
      }),
      invalidatesTags: ['GuestListInvite']
    }),
    getGuestListInviteeInvites: builder.query<GuestListInviteeInvite[], void>({
      query: () => ({
        url: 'core/guestlist-invitee-invite/',
        method: 'GET'
      }),
      providesTags: ['GuestListInvite']
    }),
    updateGuestListInviteeInvite: builder.mutation<
      GuestListInviteeInvite[],
      Partial<GuestListInviteeInvite>
    >({
      query: (body) => ({
        url: `core/guestlist-invitee-invite/${body.id}/`,
        method: 'PATCH',
        body
      }),
      invalidatesTags: ['GuestListInvite']
    })
  }),
  overrideExisting: true
});

export default guestListInvitesApi;

export const {
  useCreateGuestListInviteMutation,
  useDeleteGuestListInviteMutation,
  useGetGuestListInvitesQuery,
  useSendGuestListInviteMutation,
  useSendGuestListInvitesForEntityMutation,
  useGetGuestListInviteeInvitesQuery,
  useUpdateGuestListInviteeInviteMutation
} = guestListInvitesApi;
