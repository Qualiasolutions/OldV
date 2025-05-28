import { vuetApi } from './api';
import {
  AllReferenceGroups,
  AllReferences,
  Reference,
  ReferenceGroup
} from 'types/references';
import { getCurrentDateString } from 'utils/datesAndTimes';

const normalizeReferenceData = (data: { id: number; group: number }[]) => {
  return {
    ids: data.map(({ id }) => id),
    byId: data.reduce(
      (prev, next) => ({
        ...prev,
        [next.id]: next
      }),
      {}
    ),
    byGroup: data.reduce<{ [key: number]: number[] }>((prev, next) => {
      const newVal: { [key: number]: number[] } = { ...prev };
      newVal[next.group] = newVal[next.group]
        ? [...newVal[next.group], next.id]
        : [next.id];
      return newVal;
    }, {})
  };
};

const normalizeReferenceGroupData = (
  data: { id: number; entities: number[]; tags: string[] }[]
) => {
  return {
    ids: data.map(({ id }) => id),
    byId: data.reduce(
      (prev, next) => ({
        ...prev,
        [next.id]: next
      }),
      {}
    ),
    byEntity: data.reduce<{ [key: number]: number[] }>((prev, next) => {
      const newVal: { [key: number]: number[] } = { ...prev };
      for (const entity of next.entities) {
        newVal[entity] = newVal[entity]
          ? [...newVal[entity], next.id]
          : [next.id];
      }
      return newVal;
    }, {}),
    byTagName: data.reduce<{ [key: string]: number[] }>((prev, next) => {
      const newVal: { [key: string]: number[] } = { ...prev };
      for (const tagName of next.tags) {
        newVal[tagName] = newVal[tagName]
          ? [...newVal[tagName], next.id]
          : [next.id];
      }
      return newVal;
    }, {})
  };
};

const referencesApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllReferences: builder.query<AllReferences, void>({
      query: () => ({
        url: 'core/reference/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson = await response.json();
            return normalizeReferenceData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['Reference']
    }),
    retrievePasswordReference: builder.mutation<
      Reference,
      { reference: number; password: string }
    >({
      query: (body) => ({
        url: 'core/password-reference/',
        method: 'POST',
        body
      })
    }),
    updateReference: builder.mutation<
      Reference,
      Partial<Reference> & Pick<Reference, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/reference/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['Reference'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of referencesApi.util.selectInvalidatedBy(getState(), [
          { type: 'Reference' }
        ])) {
          if (!['getAllReferences'].includes(endpointName)) continue;
          if (endpointName === 'getAllReferences') {
            const patchResult = dispatch(
              referencesApi.util.updateQueryData(
                'getAllReferences',
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
    createReference: builder.mutation<
      Reference,
      Omit<Reference, 'id' | 'created_at'>
    >({
      query: (body) => {
        return {
          url: 'core/reference/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['Reference'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of referencesApi.util.selectInvalidatedBy(getState(), [
          { type: 'Reference' }
        ])) {
          if (endpointName !== 'getAllReferences') continue;
          const patchResult = dispatch(
            referencesApi.util.updateQueryData(
              'getAllReferences',
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

                if (patch.group) {
                  if (!draft.byGroup[patch.group]) {
                    draft.byGroup[patch.group] = [];
                  }
                  draft.byGroup[patch.group].push(mockId);
                }
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
    deleteReference: builder.mutation<void, Pick<Reference, 'id'>>({
      query: (body) => {
        return {
          url: `core/reference/${body.id}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['Reference'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of referencesApi.util.selectInvalidatedBy(getState(), [
          { type: 'Reference' }
        ])) {
          if (endpointName !== 'getAllReferences') continue;
          const patchResult = dispatch(
            referencesApi.util.updateQueryData(
              'getAllReferences',
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
    }),
    getAllReferenceGroups: builder.query<AllReferenceGroups, void>({
      query: () => ({
        url: 'core/reference-group/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson = await response.json();
            return normalizeReferenceGroupData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['Reference']
    }),
    updateReferenceGroup: builder.mutation<
      ReferenceGroup,
      Partial<ReferenceGroup> & Pick<ReferenceGroup, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/reference-group/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['Reference'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of referencesApi.util.selectInvalidatedBy(getState(), [
          { type: 'Reference' }
        ])) {
          if (!['getAllReferenceGroups'].includes(endpointName)) continue;
          if (endpointName === 'getAllReferenceGroups') {
            const patchResult = dispatch(
              referencesApi.util.updateQueryData(
                'getAllReferenceGroups',
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
    createReferenceGroup: builder.mutation<
      ReferenceGroup,
      Omit<ReferenceGroup, 'id' | 'created_at'>
    >({
      query: (body) => {
        return {
          url: 'core/reference-group/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['Reference'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of referencesApi.util.selectInvalidatedBy(getState(), [
          { type: 'Reference' }
        ])) {
          if (endpointName !== 'getAllReferenceGroups') continue;
          const patchResult = dispatch(
            referencesApi.util.updateQueryData(
              'getAllReferenceGroups',
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

                if (patch.entities) {
                  for (const entity of patch.entities) {
                    if (!draft.byEntity[entity]) {
                      draft.byEntity[entity] = [];
                    }
                    draft.byEntity[entity].push(mockId);
                  }
                }
                if (patch.tags) {
                  for (const tag of patch.tags) {
                    if (!draft.byTagName[tag]) {
                      draft.byTagName[tag] = [];
                    }
                    draft.byTagName[tag].push(mockId);
                  }
                }
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
    deleteReferenceGroup: builder.mutation<void, Pick<ReferenceGroup, 'id'>>({
      query: (body) => {
        return {
          url: `core/reference-group/${body.id}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['Reference'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of referencesApi.util.selectInvalidatedBy(getState(), [
          { type: 'Reference' }
        ])) {
          if (endpointName !== 'getAllReferenceGroups') continue;
          const patchResult = dispatch(
            referencesApi.util.updateQueryData(
              'getAllReferenceGroups',
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

export default referencesApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllReferencesQuery,
  useRetrievePasswordReferenceMutation,
  useCreateReferenceMutation,
  useUpdateReferenceMutation,
  useDeleteReferenceMutation,
  useGetAllReferenceGroupsQuery,
  useCreateReferenceGroupMutation,
  useUpdateReferenceGroupMutation,
  useDeleteReferenceGroupMutation
} = referencesApi;
