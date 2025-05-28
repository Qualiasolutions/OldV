import { normalizeData, vuetApi } from './api';
import { getCurrentDateString } from 'utils/datesAndTimes';
import { AllRoutines, Routine } from 'types/routines';

const routinesApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllRoutines: builder.query<AllRoutines, void>({
      query: () => ({
        url: 'core/routine/',
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
      providesTags: ['Routine']
    }),
    updateRoutine: builder.mutation<
      Routine,
      Partial<Routine> & Pick<Routine, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/routine/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['Routine'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of routinesApi.util.selectInvalidatedBy(getState(), [
          { type: 'Routine' }
        ])) {
          if (!['getAllRoutines'].includes(endpointName)) continue;
          if (endpointName === 'getAllRoutines') {
            const patchResult = dispatch(
              routinesApi.util.updateQueryData(
                'getAllRoutines',
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
    createRoutine: builder.mutation<
      Routine,
      Omit<Routine, 'id' | 'created_at'>
    >({
      query: (body) => {
        return {
          url: 'core/routine/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['Routine'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of routinesApi.util.selectInvalidatedBy(getState(), [
          { type: 'Routine' }
        ])) {
          if (endpointName !== 'getAllRoutines') continue;
          const patchResult = dispatch(
            routinesApi.util.updateQueryData(
              'getAllRoutines',
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
    deleteRoutine: builder.mutation<void, Pick<Routine, 'id'>>({
      query: (body) => {
        return {
          url: `core/routine/${body.id}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['Routine'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of routinesApi.util.selectInvalidatedBy(getState(), [
          { type: 'Routine' }
        ])) {
          if (endpointName !== 'getAllRoutines') continue;
          const patchResult = dispatch(
            routinesApi.util.updateQueryData(
              'getAllRoutines',
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

export default routinesApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllRoutinesQuery,
  useCreateRoutineMutation,
  useUpdateRoutineMutation,
  useDeleteRoutineMutation
} = routinesApi;
