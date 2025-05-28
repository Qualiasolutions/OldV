import { AllTasks } from './types';
import { vuetApi, normalizeData } from './api';
import {
  ScheduledTaskResponseType,
  FixedTaskResponseType,
  CreateFlexibleFixedTaskRequest,
  CreateFixedTaskRequest,
  ScheduledTaskResourceType,
  CreateRecurrentTaskOverwriteRequest,
  ScheduledEntityResponseType,
  AnniversaryTaskResponseType
} from 'types/tasks';
import { AnyAction, ThunkDispatch } from '@reduxjs/toolkit';
import { RootState } from '@reduxjs/toolkit/dist/query/core/apiState';
import { EntityTypeName, SchoolTermTypeName } from 'types/entities';
import { RESOURCE_TYPE_TO_TYPE } from 'constants/ResourceTypes';

const normalizeScheduledTaskData = ({
  tasks: taskData,
  entities: entityData
}: {
  tasks: ScheduledTaskResponseType[];
  entities: ScheduledEntityResponseType[];
}): AllScheduledTasks => {
  return {
    ordered: taskData.map(
      ({ id, recurrence_index, resourcetype, action_id }) => ({
        id,
        recurrence_index,
        resourcetype,
        action_id
      })
    ),
    byTaskId: taskData
      .filter((task) => ['FixedTask'].includes(task.resourcetype))
      .reduce<{ [key: number]: {} }>(
        (prev, next) => ({
          ...prev,
          [next.id]: {
            ...prev[next.id],
            [next.recurrence_index === null ? -1 : next.recurrence_index]: next
          }
        }),
        {}
      ),
    byActionId: taskData
      .filter((task) => task.action_id)
      .reduce<{ [key: number]: {} }>(
        (prev, next) => ({
          ...prev,
          [next.action_id as number]: {
            ...prev[next.action_id || -1], // -1 should never be used here
            [next.recurrence_index === null ? -1 : next.recurrence_index]: next
          }
        }),
        {}
      ),
    orderedEntities: entityData.map(
      ({ id, resourcetype, recurrence_index }) => ({
        id,
        resourcetype,
        recurrence_index
      })
    ),
    byEntityId: entityData.reduce<{ [key: string]: { [key: number]: {} } }>(
      (prev, next) => {
        const type = RESOURCE_TYPE_TO_TYPE[next.resourcetype] || 'ENTITY';
        return {
          ...prev,
          [type]: {
            ...(prev[type] || {}),
            [next.id]: {
              ...((prev[type] || {})[next.id || -1] || {}), // -1 should never be used here
              [next.recurrence_index === null ? -1 : next.recurrence_index]:
                next
            }
          }
        };
      },
      {}
    )
  };
};

const updateQueryDataForNewTask = (
  api: any,
  newTask: FixedTaskResponseType | AnniversaryTaskResponseType,
  dispatch: ThunkDispatch<any, any, AnyAction>,
  getState: () => RootState<any, any, 'vuetApi'>
) => {
  const state = getState();
  for (const { endpointName, originalArgs } of api.util.selectInvalidatedBy(
    state,
    [{ type: 'Task' }]
  )) {
    if (!['getAllTasks', 'getAllScheduledTasks'].includes(endpointName))
      continue;
    if (endpointName === 'getAllTasks') {
      dispatch(
        api.util.updateQueryData('getAllTasks', originalArgs, (draft: any) => {
          draft.ids.push(newTask.id);
          draft.byId[newTask.id] = {
            ...newTask,
            resourcetype: newTask.resourcetype || 'FixedTask'
          };
        })
      );
    }
    if (endpointName === 'getAllScheduledTasks') {
      if (!newTask.recurrence) {
        dispatch(
          api.util.updateQueryData(
            'getAllScheduledTasks',
            originalArgs,
            (draft: any) => {
              draft.byTaskId[newTask.id] = {
                '-1': {
                  ...newTask,
                  recurrence: null,
                  recurrence_index: null,
                  alert: [], // Assume no alert - this will update when data is refetched
                  resourcetype: 'FixedTask' // Tasks are always returned with the resource type even if not right
                }
              };

              // Update the byEntityId data on the frontend
              for (const entityId of newTask.entities) {
                draft.byEntityId[newTask.type] = {
                  ...(draft.byEntityId[newTask.type] || {}),
                  [entityId]: {
                    ...(draft.byEntityId[newTask.type]?.[entityId] || {}),
                    '-1': {
                      ...(draft.byEntityId[newTask.type]?.[entityId]?.[-1] ||
                        {}),
                      [newTask.id]: {
                        ...(draft.byEntityId[newTask.type]?.[entityId]?.[-1]?.[
                          newTask.id
                        ] || {}),
                        ...newTask
                      }
                    }
                  }
                };
              }

              draft.ordered.push({
                id: newTask.id,
                recurrence_index: null,
                resourcetype: 'FixedTask', // Tasks are always returned with the resource type even if not right
                action_id: null
              });
            }
          )
        );
      }
    }
  }

  // We can only make these performant updates if the task is
  // not recurrent - otherwise we simply have to wait for
  // the server response
};

const updateQueryDataForUpdateTask = (
  api: any,
  patch: Partial<FixedTaskResponseType> & Pick<FixedTaskResponseType, 'id'>,
  dispatch: ThunkDispatch<any, any, AnyAction>,
  getState: () => RootState<any, any, 'vuetApi'>
) => {
  const patchResults = [];
  for (const { endpointName, originalArgs } of api.util.selectInvalidatedBy(
    getState(),
    [{ type: 'Task' }]
  )) {
    if (!['getAllTasks', 'getAllScheduledTasks'].includes(endpointName))
      continue;
    if (endpointName === 'getAllTasks') {
      const patchResult = dispatch(
        api.util.updateQueryData('getAllTasks', originalArgs, (draft: any) => {
          draft.byId[patch.id] = {
            ...draft.byId[patch.id],
            ...patch
          };
        })
      );
      patchResults.push(patchResult);
    }
    if (endpointName === 'getAllScheduledTasks') {
      const patchResult = dispatch(
        api.util.updateQueryData(
          'getAllScheduledTasks',
          originalArgs,
          (draft: any) => {
            // If the task is recurrent then don't update
            // its start and end times (they can't change)
            if (!draft.byTaskId[patch.id][-1]) return;

            // Otherwise it is a single occurrence and we
            // may want to update the start and end times
            const scheduledTask = draft.byTaskId[patch.id][-1];
            const newTimes = {
              start_date: patch.start_date || scheduledTask.start_date,
              end_date: patch.end_date || scheduledTask.end_date,
              start_datetime:
                patch.start_datetime || scheduledTask.start_datetime,
              end_datetime: patch.end_datetime || scheduledTask.end_datetime,
              date: patch.date || scheduledTask.date,
              duration: patch.duration || scheduledTask.duration
            };
            draft.byTaskId[patch.id][-1] = {
              ...scheduledTask,
              ...newTimes
            };
          }
        )
      );
      patchResults.push(patchResult);
    }
  }

  return patchResults;
};

export type AllScheduledTasks = {
  ordered: {
    id: number;
    recurrence_index: number | null;
    resourcetype: ScheduledTaskResourceType;
    action_id: number | null;
  }[];
  byTaskId: {
    [key: number]: {
      [key: number]: ScheduledTaskResponseType;
    };
  };
  byActionId: {
    [key: number]: {
      [key: number]: ScheduledTaskResponseType;
    };
  };
  orderedEntities: {
    id: number;
    resourcetype: EntityTypeName | SchoolTermTypeName;
    recurrence_index: null | number;
  }[];
  byEntityId: {
    [resourcetype: string]: {
      [key: number]: {
        [key: number]: ScheduledEntityResponseType;
      };
    };
  };
};

const tasksApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    getAllScheduledTasks: builder.query<AllScheduledTasks, void>({
      query: () => ({
        url: `core/scheduled_task/?earliest_datetime=2022-01-01T00:00:00Z&latest_datetime=2026-01-01T00:00:00Z`,
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: {
              tasks: ScheduledTaskResponseType[];
              entities: ScheduledEntityResponseType[];
            } = await response.json();
            return normalizeScheduledTaskData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['Task']
    }),
    getAllTasks: builder.query<AllTasks, void>({
      query: () => ({
        url: 'core/task/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: FixedTaskResponseType[] = await response.json();
            return normalizeData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['Task']
    }),
    updateTask: builder.mutation<
      FixedTaskResponseType,
      Partial<FixedTaskResponseType> & Pick<FixedTaskResponseType, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/task/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['Task', 'Alert', 'ActionAlert', 'TaskAction'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = updateQueryDataForUpdateTask(
          tasksApi,
          patch,
          dispatch,
          getState
        );
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    updateTaskWithoutCacheInvalidation: builder.mutation<
      FixedTaskResponseType,
      Partial<FixedTaskResponseType> & Pick<FixedTaskResponseType, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/task/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['Alert', 'ActionAlert', 'TaskAction'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = updateQueryDataForUpdateTask(
          tasksApi,
          patch,
          dispatch,
          getState
        );
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    createTask: builder.mutation<FixedTaskResponseType, CreateFixedTaskRequest>(
      {
        query: (body) => {
          return {
            url: 'core/task/',
            method: 'POST',
            body
          };
        },
        invalidatesTags: ['Task', 'Alert', 'ActionAlert', 'TaskAction'], // We leave task invalidation because recurrence requires this
        async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
          try {
            const { data: newTask } = await queryFulfilled;
            updateQueryDataForNewTask(tasksApi, newTask, dispatch, getState);
          } catch (err) {
            console.error(err);
          }
        }
      }
    ),
    createTaskWithoutCacheInvalidation: builder.mutation<
      FixedTaskResponseType,
      CreateFixedTaskRequest
    >({
      query: (body) => {
        return {
          url: 'core/task/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['Alert', 'ActionAlert', 'TaskAction'],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: newTask } = await queryFulfilled;
          updateQueryDataForNewTask(tasksApi, newTask, dispatch, getState);
        } catch (err) {
          console.error(err);
        }
      }
    }),
    createFlexibleFixedTask: builder.mutation<
      FixedTaskResponseType,
      CreateFlexibleFixedTaskRequest
    >({
      query: (body) => {
        return {
          url: 'core/flexible-fixed-task/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['Alert', 'ActionAlert', 'TaskAction'],
      async onQueryStarted(_, { dispatch, queryFulfilled, getState }) {
        try {
          const { data: newTask } = await queryFulfilled;
          updateQueryDataForNewTask(tasksApi, newTask, dispatch, getState);
        } catch (err) {
          console.error(err);
        }
      }
    }),
    deleteTask: builder.mutation<
      FixedTaskResponseType,
      Pick<FixedTaskResponseType, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/task/${body.id}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['Task', 'Alert', 'ActionAlert', 'TaskAction'],
      async onQueryStarted({ id }, { dispatch, queryFulfilled, getState }) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of tasksApi.util.selectInvalidatedBy(getState(), [
          { type: 'Task' }
        ])) {
          if (endpointName === 'getAllTasks') {
            const patchResult = dispatch(
              tasksApi.util.updateQueryData(
                'getAllTasks',
                originalArgs,
                (draft) => {
                  draft.ids = draft.ids.filter(
                    (draftTaskId) => draftTaskId !== id
                  );
                  delete draft.byId[id];
                }
              )
            );
            patchResults.push(patchResult);
          }

          if (endpointName === 'getAllScheduledTasks') {
            const patchResult = dispatch(
              tasksApi.util.updateQueryData(
                'getAllScheduledTasks',
                originalArgs,
                (draft) => {
                  delete draft.byTaskId[id];
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
    bulkCreateTasks: builder.mutation<
      FixedTaskResponseType[],
      CreateFixedTaskRequest[]
    >({
      query: (body) => ({
        url: 'core/tasks/bulk_create/',
        method: 'POST',
        body
      }),
      invalidatesTags: ['Task']
    }),
    bulkDeleteTasks: builder.mutation<
      void,
      Pick<FixedTaskResponseType, 'id'>[]
    >({
      query: (body) => ({
        url: 'core/task/',
        method: 'DELETE',
        body: { pk_ids: body.map((task) => task.id) }
      }),
      invalidatesTags: ['Task']
    }),
    createRecurrentTaskOverwrite: builder.mutation<
      {
        task: FixedTaskResponseType | null;
        recurrence: number;
        recurrence_index: number;
      },
      CreateRecurrentTaskOverwriteRequest
    >({
      query: (body) => {
        return {
          url: 'core/recurrent_task_overwrite/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['Alert', 'ActionAlert', 'TaskAction'],
      async onQueryStarted(body, { dispatch, queryFulfilled, getState }) {
        try {
          const {
            data: { task: newTask }
          } = await queryFulfilled;

          if (newTask) {
            updateQueryDataForNewTask(tasksApi, newTask, dispatch, getState);
          }
        } catch (err) {
          console.error(err);
        }

        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of tasksApi.util.selectInvalidatedBy(getState(), [
          { type: 'Task' }
        ])) {
          if (!['getAllScheduledTasks'].includes(endpointName)) continue;
          if (endpointName === 'getAllScheduledTasks') {
            const patchResult = dispatch(
              tasksApi.util.updateQueryData(
                'getAllScheduledTasks',
                originalArgs,
                (draft) => {
                  delete draft.byTaskId[body.baseTaskId][body.recurrence_index];
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
    updateRecurrentTaskAfter: builder.mutation<
      {
        task: FixedTaskResponseType | null;
        recurrence: number;
        recurrence_index: number;
      },
      CreateRecurrentTaskOverwriteRequest
    >({
      query: (body) => {
        return {
          url: 'core/recurrent_task_update_after/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['Task', 'Alert', 'ActionAlert', 'TaskAction']
    })
  }),
  overrideExisting: true
});

export default tasksApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useGetAllTasksQuery,
  useGetAllScheduledTasksQuery,
  useUpdateTaskMutation,
  useUpdateTaskWithoutCacheInvalidationMutation,
  useDeleteTaskMutation,
  useCreateTaskMutation,
  useCreateTaskWithoutCacheInvalidationMutation,
  useCreateFlexibleFixedTaskMutation,
  useCreateRecurrentTaskOverwriteMutation,
  useUpdateRecurrentTaskAfterMutation,
  useBulkCreateTasksMutation,
  useBulkDeleteTasksMutation
} = tasksApi;
