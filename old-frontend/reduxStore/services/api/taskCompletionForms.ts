import { vuetApi } from './api';
import tasksApi from './tasks';

type TaskCompletionFormCreateRequest = {
  recurrence_index: number | null;
  task: number;
  complete?: boolean;
  partial?: boolean;
  ignore?: boolean;
};

export type TaskCompletionForm = {
  recurrence_index: number | null;
  task: number;
  id: number;
  ignore: boolean;
  complete: boolean;
  completion_datetime: string;
};

type TaskActionCompletionFormCreateRequest = {
  recurrence_index: number | null;
  action: number;
  ignore?: boolean;
  complete?: boolean;
};

type TaskActionCompletionForm = {
  recurrence_index: number | null;
  action: number;
  id: number;
  ignore: boolean;
  complete: boolean;
};

export type AllTaskCompletionForms = {
  ids: number[];
  byId: {
    [key: number]: TaskCompletionForm;
  };
  byTaskId: {
    [key: number]: {
      [key: number]: TaskCompletionForm;
    };
  };
};

export type AllTaskActionCompletionForms = {
  ids: number[];
  byId: {
    [key: number]: TaskActionCompletionForm;
  };
  byActionId: {
    [key: number]: {
      [key: number]: TaskActionCompletionForm;
    };
  };
};

const normalizeCompletionForms = (
  data: { id: number; task: number; recurrence_index: number | null }[]
) => {
  return {
    ids: data.map(({ id }) => id),
    byId: data.reduce<{ [key: number]: {} }>(
      (prev, next) => ({
        ...prev,
        [next.id]: next
      }),
      {}
    ),
    byTaskId: data.reduce<{ [key: number]: {} }>(
      (prev, next) => ({
        ...prev,
        [next.task]: {
          ...prev[next.task],
          [next.recurrence_index === null ? -1 : next.recurrence_index]: next
        }
      }),
      {}
    )
  };
};

const normalizeActionCompletionForms = (
  data: { id: number; action: number; recurrence_index: number | null }[]
) => {
  return {
    ids: data.map(({ id }) => id),
    byId: data.reduce<{ [key: number]: {} }>(
      (prev, next) => ({
        ...prev,
        [next.id]: next
      }),
      {}
    ),
    byActionId: data.reduce<{ [key: number]: {} }>(
      (prev, next) => ({
        ...prev,
        [next.action]: {
          ...prev[next.action],
          [next.recurrence_index === null ? -1 : next.recurrence_index]: next
        }
      }),
      {}
    )
  };
};

const isSingleEntity = (
  requestData:
    | TaskCompletionFormCreateRequest
    | TaskCompletionFormCreateRequest[]
): requestData is TaskCompletionFormCreateRequest => {
  return !Array.isArray(requestData);
};

const taskCompletionFormsApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getTaskCompletionForms: builder.query<AllTaskCompletionForms, void>({
      query: () => ({
        url: 'core/task_completion_form/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: TaskCompletionForm[] = await response.json();
            return normalizeCompletionForms(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['TaskCompletionForm']
    }),
    getTaskActionCompletionForms: builder.query<
      AllTaskActionCompletionForms,
      void
    >({
      query: () => ({
        url: 'core/task_action_completion_form/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: TaskActionCompletionForm[] =
              await response.json();
            return normalizeActionCompletionForms(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['TaskCompletionForm']
    }),
    createTaskCompletionForm: builder.mutation<
      object,
      TaskCompletionFormCreateRequest | TaskCompletionFormCreateRequest[]
    >({
      query: (body) => {
        return {
          url: 'core/task_completion_form/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['TaskCompletionForm'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        const newForms = isSingleEntity(patch) ? [patch] : patch;
        for (const {
          endpointName,
          originalArgs
        } of taskCompletionFormsApi.util.selectInvalidatedBy(getState(), [
          { type: 'TaskCompletionForm' }
        ])) {
          if (endpointName !== 'getTaskCompletionForms') continue;
          const patchResult = dispatch(
            taskCompletionFormsApi.util.updateQueryData(
              'getTaskCompletionForms',
              originalArgs,
              (draft) => {
                for (const newForm of newForms) {
                  const mockId = 1e10 + Math.round(Math.random() * 1e10);
                  const mockEntry = {
                    ...newForm,
                    ignore: !!newForm.ignore,
                    complete:
                      newForm.complete === undefined ? true : newForm.complete,
                    id: mockId,
                    completion_datetime: new Date().toISOString()
                  };
                  draft.ids.push(mockId);
                  draft.byId[mockId] = mockEntry;

                  if (!draft.byTaskId[newForm.task]) {
                    draft.byTaskId[newForm.task] = {};
                  }
                  draft.byTaskId[newForm.task][
                    newForm.recurrence_index === null
                      ? -1
                      : newForm.recurrence_index
                  ] = mockEntry;
                }
              }
            )
          );
          patchResults.push(patchResult);
        }

        for (const {
          endpointName,
          originalArgs
        } of tasksApi.util.selectInvalidatedBy(getState(), [
          { type: 'Task' }
        ])) {
          if (endpointName !== 'getAllScheduledTasks') continue;
          const patchResult = dispatch(
            tasksApi.util.updateQueryData(
              'getAllScheduledTasks',
              originalArgs,
              (draft) => {
                for (const newForm of newForms) {
                  const existingTask =
                    draft.byTaskId[newForm.task][
                      newForm.recurrence_index === null
                        ? -1
                        : newForm.recurrence_index
                    ];
                  existingTask.is_complete =
                    newForm.complete === undefined ? true : newForm.complete;
                  existingTask.is_partially_complete =
                    newForm.partial === undefined ? false : newForm.partial;
                  existingTask.is_ignored =
                    newForm.ignore === undefined ? false : newForm.ignore;
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
    deleteTaskCompletionForm: builder.mutation<
      null,
      { formId: number; taskId: number; recurrenceIndex: number }
    >({
      query: ({ formId }) => {
        return {
          url: `core/task_completion_form/${formId}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['TaskCompletionForm'],
      async onQueryStarted(
        { formId, taskId, recurrenceIndex },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of taskCompletionFormsApi.util.selectInvalidatedBy(getState(), [
          { type: 'TaskCompletionForm' }
        ])) {
          if (endpointName !== 'getTaskCompletionForms') continue;
          const patchResult = dispatch(
            taskCompletionFormsApi.util.updateQueryData(
              'getTaskCompletionForms',
              originalArgs,
              (draft) => {
                draft.ids = draft.ids.filter(
                  (draftFormId) => draftFormId !== formId
                );
                delete draft.byId[formId];
                delete draft.byTaskId[taskId][recurrenceIndex];
              }
            )
          );
          patchResults.push(patchResult);
        }

        for (const {
          endpointName,
          originalArgs
        } of tasksApi.util.selectInvalidatedBy(getState(), [
          { type: 'Task' }
        ])) {
          if (endpointName !== 'getAllScheduledTasks') continue;
          const patchResult = dispatch(
            tasksApi.util.updateQueryData(
              'getAllScheduledTasks',
              originalArgs,
              (draft) => {
                draft.byTaskId[taskId][recurrenceIndex].is_complete = false;
                draft.byTaskId[taskId][recurrenceIndex].is_ignored = false;
                draft.byTaskId[taskId][recurrenceIndex].is_partially_complete =
                  false;
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
    createTaskActionCompletionForm: builder.mutation<
      object,
      TaskActionCompletionFormCreateRequest
    >({
      query: (body) => {
        return {
          url: 'core/task_action_completion_form/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['TaskCompletionForm'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of taskCompletionFormsApi.util.selectInvalidatedBy(getState(), [
          { type: 'TaskCompletionForm' }
        ])) {
          if (endpointName !== 'getTaskActionCompletionForms') continue;
          const patchResult = dispatch(
            taskCompletionFormsApi.util.updateQueryData(
              'getTaskActionCompletionForms',
              originalArgs,
              (draft) => {
                const mockId = 1e10 + Math.round(Math.random() * 1e10);
                const mockEntry = {
                  ...patch,
                  ignore: !!patch.ignore,
                  complete:
                    patch.complete === undefined ? true : patch.complete,
                  id: mockId
                };
                draft.ids.push(mockId);
                draft.byId[mockId] = mockEntry;

                if (!draft.byActionId[patch.action]) {
                  draft.byActionId[patch.action] = {};
                }
                draft.byActionId[patch.action][
                  patch.recurrence_index === null ? -1 : patch.recurrence_index
                ] = mockEntry;
              }
            )
          );
          patchResults.push(patchResult);
        }

        for (const {
          endpointName,
          originalArgs
        } of tasksApi.util.selectInvalidatedBy(getState(), [
          { type: 'Task' }
        ])) {
          if (endpointName !== 'getAllScheduledTasks') continue;
          const patchResult = dispatch(
            tasksApi.util.updateQueryData(
              'getAllScheduledTasks',
              originalArgs,
              (draft) => {
                const existingTask =
                  draft.byActionId[patch.action][
                    patch.recurrence_index === null
                      ? -1
                      : patch.recurrence_index
                  ];
                existingTask.is_complete =
                  patch.complete === undefined ? true : patch.complete;
                existingTask.is_ignored =
                  patch.ignore === undefined ? true : patch.ignore;
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
    deleteTaskActionCompletionForm: builder.mutation<
      object,
      { formId: number; actionId: number; recurrenceIndex: number }
    >({
      query: ({ formId }) => {
        return {
          url: `core/task_action_completion_form/${formId}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['TaskCompletionForm'],
      async onQueryStarted(
        { formId, actionId, recurrenceIndex },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of taskCompletionFormsApi.util.selectInvalidatedBy(getState(), [
          { type: 'TaskCompletionForm' }
        ])) {
          if (endpointName !== 'getTaskActionCompletionForms') continue;
          const patchResult = dispatch(
            taskCompletionFormsApi.util.updateQueryData(
              'getTaskActionCompletionForms',
              originalArgs,
              (draft) => {
                draft.ids = draft.ids.filter(
                  (draftFormId) => draftFormId !== formId
                );
                delete draft.byId[formId];
                delete draft.byActionId[actionId][recurrenceIndex];
              }
            )
          );
          patchResults.push(patchResult);
        }

        for (const {
          endpointName,
          originalArgs
        } of tasksApi.util.selectInvalidatedBy(getState(), [
          { type: 'Task' }
        ])) {
          if (endpointName !== 'getAllScheduledTasks') continue;
          const patchResult = dispatch(
            tasksApi.util.updateQueryData(
              'getAllScheduledTasks',
              originalArgs,
              (draft) => {
                draft.byActionId[actionId][recurrenceIndex].is_complete = false;
                draft.byActionId[actionId][recurrenceIndex].is_ignored = false;
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

export default taskCompletionFormsApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useCreateTaskCompletionFormMutation,
  useGetTaskCompletionFormsQuery,
  useDeleteTaskCompletionFormMutation,
  useDeleteTaskActionCompletionFormMutation,
  useCreateTaskActionCompletionFormMutation,
  useGetTaskActionCompletionFormsQuery
} = taskCompletionFormsApi;
