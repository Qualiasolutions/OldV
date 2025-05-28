import { vuetApi } from './api';
import { CreateMessageRequest, MessageResponse } from 'types/messages';

const messagesApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    createMessage: builder.mutation<MessageResponse, CreateMessageRequest>({
      query: (body) => ({
        url: 'core/message/',
        method: 'POST',
        body: body
      }),
      invalidatesTags: ['Message']
    }),
    getMessagesForTaskId: builder.query<
      MessageResponse[],
      { taskId: number; recurrenceIndex: number | null }
    >({
      query: ({ taskId, recurrenceIndex }) => ({
        url: `core/message/?task=${taskId}${
          recurrenceIndex ? `&recurrence_index=${recurrenceIndex}` : ''
        }`,
        method: 'GET'
      }),
      providesTags: ['Message']
    }),
    getMessagesForEntityId: builder.query<MessageResponse[], number>({
      query: (entityId) => ({
        url: `core/message/?entity=${entityId}`,
        method: 'GET'
      }),
      providesTags: ['Message']
    }),
    getMessagesForActionId: builder.query<MessageResponse[], number>({
      query: (actionId) => ({
        url: `core/message/?action=${actionId}`,
        method: 'GET'
      }),
      providesTags: ['Message']
    }),
    getMessageThreads: builder.query<MessageResponse[], void>({
      query: () => ({
        url: `core/message_threads/`,
        method: 'GET'
      }),
      providesTags: ['Message']
    })
  }),
  overrideExisting: true
});

export const {
  useCreateMessageMutation,
  useGetMessageThreadsQuery,
  useGetMessagesForTaskIdQuery,
  useGetMessagesForEntityIdQuery,
  useGetMessagesForActionIdQuery
} = messagesApi;
