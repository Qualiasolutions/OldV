import { vuetApi, normalizeData } from './api';
import { ActionAlert, Alert, AllActionAlerts, AllAlerts } from 'types/alerts';

const normalizeAlerts = (data: { id: number; task: number }[]) => {
  return {
    ids: data.map(({ id }) => id),
    byId: data.reduce(
      (prev, next) => ({
        ...prev,
        [next.id]: next
      }),
      {}
    ),
    byTask: data.reduce<{ [key: number]: number[] }>((prev, next) => {
      if (prev[next.task]) {
        return {
          ...prev,
          [next.task]: [...prev[next.task], next.id]
        };
      }
      return {
        ...prev,
        [next.task]: [next.id]
      };
    }, {})
  };
};

const normalizeActionAlerts = (data: { id: number; action: number }[]) => {
  return {
    ids: data.map(({ id }) => id),
    byId: data.reduce(
      (prev, next) => ({
        ...prev,
        [next.id]: next
      }),
      {}
    ),
    byAction: data.reduce<{ [key: number]: number[] }>((prev, next) => {
      if (prev[next.action]) {
        return {
          ...prev,
          [next.action]: [...prev[next.action], next.id]
        };
      }
      return {
        ...prev,
        [next.action]: [next.id]
      };
    }, {})
  };
};

const alertsApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllAlerts: builder.query<AllAlerts, void>({
      query: () => ({
        url: 'core/alert/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: Alert[] = await response.json();
            return normalizeAlerts(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['Alert']
    }),
    deleteAlert: builder.mutation<void, Pick<Alert, 'id' | 'task'>>({
      query: (body) => {
        return {
          url: `core/alert/${body.id}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['Alert'],
      async onQueryStarted(
        { id: idToDelete, task },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of alertsApi.util.selectInvalidatedBy(getState(), [
          { type: 'Alert' }
        ])) {
          if (endpointName !== 'getAllAlerts') continue;
          const patchResult = dispatch(
            alertsApi.util.updateQueryData(
              'getAllAlerts',
              originalArgs,
              (draft) => {
                draft.ids = draft.ids.filter((id) => id !== idToDelete);
                draft.byTask[task] = draft.byTask[task].filter(
                  (id) => id !== idToDelete
                );
                delete draft.byId[idToDelete];
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
    getAllActionAlerts: builder.query<AllActionAlerts, void>({
      query: () => ({
        url: 'core/action-alert/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: ActionAlert[] = await response.json();
            return normalizeActionAlerts(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['ActionAlert']
    }),
    deleteActionAlert: builder.mutation<
      void,
      Pick<ActionAlert, 'id' | 'action'>
    >({
      query: (body) => {
        return {
          url: `core/action-alert/${body.id}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['ActionAlert'],
      async onQueryStarted(
        { id: idToDelete, action },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of alertsApi.util.selectInvalidatedBy(getState(), [
          { type: 'ActionAlert' }
        ])) {
          if (endpointName !== 'getAllActionAlerts') continue;
          const patchResult = dispatch(
            alertsApi.util.updateQueryData(
              'getAllActionAlerts',
              originalArgs,
              (draft) => {
                draft.ids = draft.ids.filter((id) => id !== idToDelete);
                draft.byAction[action] = draft.byAction[action].filter(
                  (id) => id !== idToDelete
                );
                delete draft.byId[idToDelete];
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
    markAlertsRead: builder.mutation<void, number>({
      query: (userId) => {
        return {
          url: `core/mark-alerts-read/`,
          method: 'POST',
          body: { user: userId }
        };
      },
      invalidatesTags: ['Alert', 'ActionAlert']
    })
  }),
  overrideExisting: true
});

export default alertsApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllAlertsQuery,
  useDeleteAlertMutation,
  useGetAllActionAlertsQuery,
  useDeleteActionAlertMutation,
  useMarkAlertsReadMutation
} = alertsApi;
