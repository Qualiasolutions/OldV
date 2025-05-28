import { normalizeData, vuetApi } from './api';
import { getCurrentDateString } from 'utils/datesAndTimes';
import { AllTimeBlocks, TimeBlock } from 'types/timeblocks';

const timeBlocksApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllTimeBlocks: builder.query<AllTimeBlocks, void>({
      query: () => ({
        url: 'core/timeblock/',
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
      providesTags: ['TimeBlock']
    }),
    updateTimeBlock: builder.mutation<
      TimeBlock,
      Partial<TimeBlock> & Pick<TimeBlock, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/timeblock/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['TimeBlock'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of timeBlocksApi.util.selectInvalidatedBy(getState(), [
          { type: 'TimeBlock' }
        ])) {
          if (!['getAllTimeBlocks'].includes(endpointName)) continue;
          if (endpointName === 'getAllTimeBlocks') {
            const patchResult = dispatch(
              timeBlocksApi.util.updateQueryData(
                'getAllTimeBlocks',
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
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    createTimeBlock: builder.mutation<
      TimeBlock,
      Omit<TimeBlock, 'id' | 'created_at'>
    >({
      query: (body) => {
        return {
          url: 'core/timeblock/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['TimeBlock'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of timeBlocksApi.util.selectInvalidatedBy(getState(), [
          { type: 'TimeBlock' }
        ])) {
          if (endpointName !== 'getAllTimeBlocks') continue;
          const patchResult = dispatch(
            timeBlocksApi.util.updateQueryData(
              'getAllTimeBlocks',
              originalArgs,
              (draft) => {
                const mockId = 1e10 + Math.round(Math.random() * 1e10);
                const mockEntry = {
                  ...patch,
                  created_at: getCurrentDateString(),
                  id: mockId
                };
                draft.ids.push(mockId);
                draft.byId[mockId] = mockEntry;
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
    }),
    deleteTimeBlock: builder.mutation<void, Pick<TimeBlock, 'id'>>({
      query: (body) => {
        return {
          url: `core/timeblock/${body.id}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['TimeBlock'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of timeBlocksApi.util.selectInvalidatedBy(getState(), [
          { type: 'TimeBlock' }
        ])) {
          if (endpointName !== 'getAllTimeBlocks') continue;
          const patchResult = dispatch(
            timeBlocksApi.util.updateQueryData(
              'getAllTimeBlocks',
              originalArgs,
              (draft) => {
                draft.ids = draft.ids.filter((id) => id !== patch.id);
                delete draft.byId[patch.id];
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

export default timeBlocksApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllTimeBlocksQuery,
  useCreateTimeBlockMutation,
  useUpdateTimeBlockMutation,
  useDeleteTimeBlockMutation
} = timeBlocksApi;
