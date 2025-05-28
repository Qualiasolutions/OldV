import { AllTaskActions, TaskAction } from 'types/taskActions';
import { normalizeData, vuetApi } from './api';

const taskActionsApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTaskActions: builder.query<AllTaskActions, void>({
      query: () => ({
        url: 'core/task-action/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson = await response.json();
            return normalizeData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['TaskAction']
    }),
    updateTaskAction: builder.mutation<
      TaskAction,
      Partial<TaskAction> &
        Pick<TaskAction, 'id'> & {
          start_datetime?: string;
          end_datetime?: string;
        }
    >({
      query: (body) => {
        return {
          url: `core/task-action/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['TaskAction'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of taskActionsApi.util.selectInvalidatedBy(getState(), [
          { type: 'TaskAction' }
        ])) {
          if (endpointName !== 'getAllTaskActions') continue;
          const patchResult = dispatch(
            taskActionsApi.util.updateQueryData(
              'getAllTaskActions',
              originalArgs,
              (draft) => {
                draft.byId[patch.id] = {
                  ...draft.byId[patch.id],
                  ...patch
                };
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    })
  }),
  overrideExisting: true
});

export default taskActionsApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const { useUpdateTaskActionMutation, useGetAllTaskActionsQuery } =
  taskActionsApi;
