import { vuetApi, normalizeData } from './api';
import { AllTaskLimits, TaskLimitResponseType } from 'types/taskLimits';

const extendedApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTaskLimits: builder.query<AllTaskLimits, void>({
      query: () => ({
        url: 'core/task-limit/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: TaskLimitResponseType[] = await response.json();
            return normalizeData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['TaskLimit']
    }),
    updateTaskLimit: builder.mutation<
      TaskLimitResponseType,
      Partial<TaskLimitResponseType> & Pick<TaskLimitResponseType, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/task-limit/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['TaskLimit']
    }),
    createTaskLimit: builder.mutation<
      TaskLimitResponseType,
      Omit<TaskLimitResponseType, 'id'>
    >({
      query: (body) => {
        return {
          url: 'core/task-limit/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['TaskLimit']
    }),
    deleteTaskLimit: builder.mutation<
      TaskLimitResponseType,
      Pick<TaskLimitResponseType, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/task-limit/${body.id}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['TaskLimit']
    })
  }),
  overrideExisting: true
});

export default extendedApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllTaskLimitsQuery,
  useUpdateTaskLimitMutation,
  useDeleteTaskLimitMutation,
  useCreateTaskLimitMutation
} = extendedApi;
