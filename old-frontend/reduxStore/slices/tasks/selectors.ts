import { createSelector } from '@reduxjs/toolkit';
import dayjs from 'dayjs';
import entitiesApi from 'reduxStore/services/api/entities';
import routinesApi from 'reduxStore/services/api/routines';
import taskActionsApi from 'reduxStore/services/api/taskActions';
import taskCompletionFormsApi from 'reduxStore/services/api/taskCompletionForms';
import tasksApi from 'reduxStore/services/api/tasks';
import { CategoryName } from 'types/categories';
import { DayType } from 'types/datesAndTimes';
import { EntityTypeName } from 'types/entities';

import { getDateStringFromDateObject } from 'utils/datesAndTimes';

import {
  HiddenTagType,
  ScheduledTask,
  ScheduledTaskResponseType,
  TaskType
} from 'types/tasks';
import { formatTasksPerDate } from 'utils/formatTasksAndPeriods';
import {
  selectCompletionFilters,
  selectFilteredCategories,
  selectFilteredTaskTypes,
  selectFilteredUsers
} from '../calendars/selectors';
import INFO_CATEGORY_TAGS from 'constants/InfoCategoryTags';
import { AllCategories, AllEntities } from 'reduxStore/services/api/types';
import categoriesApi from 'reduxStore/services/api/categories';

const TAG_TO_CATEGORY: { [key: string]: CategoryName } = {
  ...INFO_CATEGORY_TAGS,
  SOCIAL_INTERESTS__BIRTHDAY: 'SOCIAL_INTERESTS',
  SOCIAL_INTERESTS__ANNIVERSARY: 'SOCIAL_INTERESTS',
  SOCIAL_INTERESTS__HOLIDAY: 'SOCIAL_INTERESTS',
  PETS_FEEDING: 'PETS',
  PETS_EXERCISE: 'PETS',
  PETS_GROOMING: 'PETS',
  PETS_HEALTH: 'PETS'
};

const isTask = (
  item: ScheduledTaskResponseType | undefined
): item is ScheduledTaskResponseType => {
  return !!item;
};

export const selectTaskById = (id: number) =>
  createSelector(tasksApi.endpoints.getAllTasks.select(), (tasks) => {
    return tasks.data?.byId && tasks.data?.byId[id];
  });

export const selectTaskActionById = (id: number) =>
  createSelector(
    taskActionsApi.endpoints.getAllTaskActions.select(),
    (taskActions) => {
      return (taskActions.data?.byId && taskActions.data?.byId[id]) || null;
    }
  );

export const selectTaskCompletionFormById = (id: number) =>
  createSelector(
    taskCompletionFormsApi.endpoints.getTaskCompletionForms.select(),
    (forms) => {
      return forms.data?.byId && forms.data?.byId[id];
    }
  );

export const selectNewTaskIds = createSelector(
  tasksApi.endpoints.getAllTasks.select(),
  (tasks) => {
    const tasksData = tasks?.data;
    if (!tasksData) {
      return [];
    }
    const reverseSortedIds = [...tasksData.ids].sort((a, b) =>
      a < b ? 1 : -1
    );
    const newIds = [];

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    for (const id of reverseSortedIds) {
      if (new Date(tasksData.byId[id].created_at) > threeDaysAgo) {
        newIds.push(id);
        continue;
      }
      // If the latest ID is not new then neathir is anything older
      return newIds;
    }
    return newIds;
  }
);

const ALERTABLE_TYPES = ['TASK', 'DUE_DATE'];

export const selectOverdueTasks = createSelector(
  tasksApi.endpoints.getAllScheduledTasks.select(),
  taskActionsApi.endpoints.getAllTaskActions.select(),
  taskCompletionFormsApi.endpoints.getTaskCompletionForms.select(),
  taskCompletionFormsApi.endpoints.getTaskActionCompletionForms.select(),
  (tasks, taskActions, taskCompletionForms, taskActionCompletionForms) => {
    const tasksData = tasks?.data;
    const taskActionsData = taskActions?.data;
    const taskCompletionFormsData = taskCompletionForms?.data;
    const taskActionCompletionFormsData = taskActionCompletionForms?.data;

    if (
      !tasksData ||
      !taskActionsData ||
      !taskCompletionFormsData ||
      !taskActionCompletionFormsData
    ) {
      return [];
    }

    const overdueTasks: ScheduledTaskResponseType[] = [];
    for (const {
      id,
      recurrence_index: recIndex,
      action_id: actionId
    } of tasksData.ordered) {
      const recurrenceIndex = recIndex === null ? -1 : recIndex;
      const task = actionId
        ? tasksData.byActionId[actionId][recurrenceIndex]
        : tasksData.byTaskId[id][recurrenceIndex];

      if (!task || !ALERTABLE_TYPES.includes(task.type)) {
        continue;
      }

      const taskDatetimeString =
        task?.start_datetime || task?.start_date || task?.date;
      if (!taskDatetimeString) {
        continue;
      }

      const isComplete = actionId
        ? !!(
            taskActionCompletionFormsData.byActionId[actionId] &&
            taskActionCompletionFormsData.byActionId[actionId][
              recurrenceIndex
            ] &&
            taskActionCompletionFormsData.byActionId[actionId][recurrenceIndex]
              .complete
          )
        : !!(
            taskCompletionFormsData.byTaskId[id] &&
            taskCompletionFormsData.byTaskId[id][recurrenceIndex] &&
            taskCompletionFormsData.byTaskId[id][recurrenceIndex].complete
          );

      if (!isComplete) {
        const taskStart = new Date(taskDatetimeString);
        if (
          getDateStringFromDateObject(taskStart) <
            getDateStringFromDateObject(new Date()) &&
          !task.is_complete
        ) {
          overdueTasks.push(task);
        }
        if (taskStart > new Date()) {
          return overdueTasks;
        }
      }
    }

    return overdueTasks;
  }
);

const filterTask = (
  task: ScheduledTaskResponseType,
  filteredUsers: number[],
  filteredCategories: number[],
  filteredTaskTypes: (TaskType | 'OTHER')[],
  completionFilters: ('COMPLETE' | 'INCOMPLETE')[],
  allCategories: AllCategories,
  allEntities: AllEntities
) => {
  return (
    (!filteredUsers ||
      filteredUsers.length === 0 ||
      task.members.some((member) => filteredUsers?.includes(member))) &&
    (!filteredCategories ||
      filteredCategories.length === 0 ||
      filteredCategories.length === allCategories.ids.length ||
      task.entities.some((entityId) => {
        const entity = allEntities.byId[entityId];
        return entity && filteredCategories.includes(entity.category);
      }) ||
      task.tags.some((tagName) => {
        const tagCategoryName = TAG_TO_CATEGORY[tagName];
        const categoryId =
          tagCategoryName && allCategories.byName[tagCategoryName]?.id;
        return categoryId && filteredCategories.includes(categoryId);
      })) &&
    (!filteredTaskTypes ||
      filteredTaskTypes.length === 0 ||
      filteredTaskTypes.includes(task.type) ||
      (filteredTaskTypes.includes('OTHER') &&
        !['TASK', 'APPOINTMENT'].includes(task.type))) &&
    (!completionFilters ||
      completionFilters.length === 0 ||
      (completionFilters.includes('COMPLETE') &&
        completionFilters.includes('INCOMPLETE')) ||
      (completionFilters.includes('COMPLETE') && task.is_complete) ||
      (completionFilters.includes('INCOMPLETE') &&
        !task.is_complete &&
        (task.action_id || (task && ['TASK', 'DUE_DATE'].includes(task.type)))))
  );
};

export const selectFilteredOverdueTasks = createSelector(
  selectOverdueTasks,
  selectFilteredUsers,
  selectFilteredCategories,
  selectFilteredTaskTypes,
  selectCompletionFilters,
  categoriesApi.endpoints.getAllCategories.select(),
  entitiesApi.endpoints.getAllEntities.select(),
  (
    tasks,
    users,
    categories,
    taskTypes,
    completionFilters,
    allCategories,
    allEntities
  ) => {
    const categoriesData = allCategories.data;
    const entitiesData = allEntities.data;

    if (
      !categoriesData ||
      !entitiesData ||
      !users ||
      !categories ||
      !taskTypes ||
      !completionFilters
    ) {
      return [];
    }

    return tasks.filter((task) =>
      filterTask(
        task,
        users,
        categories,
        taskTypes,
        completionFilters,
        categoriesData,
        entitiesData
      )
    );
  }
);

export const selectTasksInDailyRoutines = createSelector(
  tasksApi.endpoints.getAllScheduledTasks.select(),
  routinesApi.endpoints.getAllRoutines.select(),
  (tasks, routines) => {
    const taskData = tasks.data;
    const routinesData = routines.data;

    if (!taskData || !routinesData) {
      return {};
    }

    const dateTasksPerRoutine: {
      [date: string]: {
        [routine: number]: ScheduledTask[];
      };
    } = {};

    const allScheduledTasks = taskData.ordered
      .map(({ id, recurrence_index, action_id }) => {
        if (action_id) {
          return taskData.byActionId[action_id][
            recurrence_index === null ? -1 : recurrence_index
          ];
        }
        if (id) {
          return taskData.byTaskId[id][
            recurrence_index === null ? -1 : recurrence_index
          ];
        }
      })
      .filter(isTask);

    const tasksByDate = formatTasksPerDate(allScheduledTasks);
    for (const taskDate in tasksByDate) {
      const dayJsDate = dayjs(taskDate);
      const weekdayName = dayJsDate.format('dddd').toLowerCase() as DayType;

      const dayRoutines =
        routinesData.ids
          .filter((id) => routinesData.byId[id][weekdayName])
          .map((id) => routinesData.byId[id]) || [];

      const routineTasks: { [key: number]: ScheduledTask[] } = {};
      for (const routine of dayRoutines) {
        routineTasks[routine.id] = [];
      }

      const nonRoutineTasks: ScheduledTask[] = [];

      if (tasksByDate[taskDate]) {
        for (const taskObj of tasksByDate[taskDate]) {
          if (taskObj.start_datetime && taskObj.end_datetime) {
            if (!taskObj.routine) {
              nonRoutineTasks.push(taskObj);
              continue;
            }

            // In this case the task is a fixed task
            const startTime = new Date(taskObj.start_datetime || '');
            const startDate = dayjs(startTime).format('YYYY-MM-DD');
            const endTime = new Date(taskObj.end_datetime || '');
            const endDate = dayjs(endTime).format('YYYY-MM-DD');
            const multiDay = startDate !== endDate;

            if (multiDay) {
              nonRoutineTasks.push(taskObj);
              continue;
            }

            const assignedRoutine = routinesData.byId[taskObj.routine];
            if (
              dayjs(taskObj.start_datetime).format('HH:mm:dd') >=
                assignedRoutine.start_time &&
              dayjs(taskObj.end_datetime).format('HH:mm:dd') <=
                assignedRoutine.end_time
            ) {
              routineTasks[assignedRoutine.id].push(taskObj);
            } else {
              nonRoutineTasks.push(taskObj);
            }
          } else {
            // Otherwise it is a due date and we place
            // it in a routine if it is assigned to one
            if (taskObj.routine) {
              if (taskObj.routine in routineTasks) {
                routineTasks[taskObj.routine].push(taskObj);
                continue;
              }
            }
            nonRoutineTasks.push(taskObj);
          }
        }
      }

      const routineIdsToShow = Object.keys(routineTasks)
        .filter((routineId) => routineTasks[parseInt(routineId)].length > 0)
        .map((id) => parseInt(id));

      for (const routineId of routineIdsToShow) {
        if (!dateTasksPerRoutine[taskDate]) {
          dateTasksPerRoutine[taskDate] = {};
        }
        dateTasksPerRoutine[taskDate][routineId] = routineTasks[routineId];
      }

      if (!dateTasksPerRoutine[taskDate]) {
        dateTasksPerRoutine[taskDate] = {};
      }

      dateTasksPerRoutine[taskDate][-1] = nonRoutineTasks;
    }

    return dateTasksPerRoutine;
  }
);

export const selectTasksForRoutineForDate = (routine: number, date: string) => {
  return createSelector(selectTasksInDailyRoutines, (dailyTasksPerRoutine) => {
    return dailyTasksPerRoutine[date][routine];
  });
};

const EXTRA_ENTITY_TYPE_ITEMS: {
  [key in EntityTypeName]?: {
    tags?: string[];
    types?: string[];
    entityTypes?: EntityTypeName[];
  };
} = {
  AnniversaryPlan: {
    tags: ['SOCIAL_INTERESTS__BIRTHDAY', 'SOCIAL_INTERESTS__ANNIVERSARY'],
    types: ['BIRTHDAY', 'ANNIVERSARY']
  },
  HolidayPlan: {
    tags: ['SOCIAL_INTERESTS__HOLIDAY'],
    types: ['HOLIDAY']
  },
  Event: {
    entityTypes: ['EventSubentity']
  }
};

export const selectScheduledTaskIdsByEntityTypes = (
  entityTypes: EntityTypeName[]
) =>
  createSelector(
    tasksApi.endpoints.getAllScheduledTasks.select(),
    entitiesApi.endpoints.getAllEntities.select(),
    (scheduledTasks, allEntities) => {
      const entitiesData = allEntities.data;
      const taskData = scheduledTasks.data;
      if (!taskData || !entitiesData) {
        return {};
      }

      const filteredTasks =
        taskData.ordered
          .map(({ id, recurrence_index, resourcetype, action_id }) => {
            const recurrenceIndex =
              recurrence_index === null ? -1 : recurrence_index;
            if (['FixedTask'].includes(resourcetype)) {
              return taskData.byTaskId[id][recurrenceIndex];
            }

            if (action_id) {
              return scheduledTasks.data?.byActionId[action_id][
                recurrenceIndex
              ];
            }
          })
          .filter(isTask)
          .filter(
            (task) =>
              !entityTypes ||
              entityTypes.length === 0 ||
              task.entities.some(
                (ent) =>
                  entitiesData.byId[ent] &&
                  entityTypes.includes(entitiesData.byId[ent].resourcetype)
              ) ||
              entityTypes.some((entityType) => {
                const extraItems = EXTRA_ENTITY_TYPE_ITEMS[entityType];
                if (!extraItems) {
                  return false;
                }
                return (
                  (extraItems.tags &&
                    task.tags.some((tag) => extraItems?.tags?.includes(tag))) ||
                  (extraItems.types && extraItems.types.includes(task.type)) ||
                  (extraItems.entityTypes &&
                    task.entities.some(
                      (entityId) =>
                        extraItems.entityTypes &&
                        entitiesData.byId[entityId] &&
                        extraItems.entityTypes.includes(
                          entitiesData.byId[entityId].resourcetype
                        )
                    ))
                );
              })
          ) || [];

      const formatted = formatTasksPerDate(filteredTasks);

      return formatted;
    }
  );

export const selectScheduledTaskIdsByTagNames = (tagNames: string[]) =>
  createSelector(
    tasksApi.endpoints.getAllScheduledTasks.select(),
    (scheduledTasks) => {
      if (!scheduledTasks.data) {
        return {};
      }

      const filteredTasks =
        scheduledTasks.data.ordered
          .map(({ id, recurrence_index, resourcetype, action_id }) => {
            const recurrenceIndex =
              recurrence_index === null ? -1 : recurrence_index;
            if (['FixedTask'].includes(resourcetype)) {
              return scheduledTasks.data?.byTaskId[id][recurrenceIndex];
            }

            if (action_id) {
              return scheduledTasks.data?.byActionId[action_id][
                recurrenceIndex
              ];
            }
          })
          .filter(isTask)
          .filter(
            (task) =>
              !tagNames ||
              tagNames.length === 0 ||
              task.tags.some((tagName) => tagNames?.includes(tagName))
          ) || [];

      const formatted = formatTasksPerDate(filteredTasks);

      return formatted;
    }
  );

export const selectScheduledTaskIdsByProfessionalCategory = (
  categoryId: number
) =>
  createSelector(
    tasksApi.endpoints.getAllScheduledTasks.select(),
    entitiesApi.endpoints.getAllEntities.select(),
    (scheduledTasks, allEntities) => {
      const entitiesData = allEntities.data;
      const taskData = scheduledTasks.data;
      if (!taskData || !entitiesData) {
        return {};
      }

      const filteredTasks = taskData.ordered
        .map(({ id, recurrence_index, resourcetype, action_id }) => {
          const recurrenceIndex =
            recurrence_index === null ? -1 : recurrence_index;
          if (['FixedTask'].includes(resourcetype)) {
            return taskData.byTaskId[id][recurrenceIndex];
          }

          if (action_id) {
            return scheduledTasks.data?.byActionId[action_id][recurrenceIndex];
          }
        })
        .filter(isTask)
        .filter((task) =>
          task.entities.some(
            (ent) =>
              entitiesData.byId[ent] &&
              entitiesData.byId[ent].professional_category === categoryId
          )
        );

      const formatted = formatTasksPerDate(filteredTasks);

      return formatted;
    }
  );

export const selectScheduledTask = ({
  id,
  recurrenceIndex,
  actionId
}: {
  id?: number | null;
  recurrenceIndex?: number | null;
  actionId?: number | null;
}) =>
  createSelector(
    tasksApi.endpoints.getAllScheduledTasks.select(),
    (scheduledTasks) => {
      const recIndex =
        recurrenceIndex === null || recurrenceIndex === undefined
          ? -1
          : recurrenceIndex;
      if (actionId && scheduledTasks.data?.byActionId[actionId]) {
        return scheduledTasks.data?.byActionId[actionId][recIndex];
      }
      if (id) {
        return (
          scheduledTasks.data?.byTaskId &&
          scheduledTasks.data?.byTaskId[id] &&
          scheduledTasks.data?.byTaskId[id][recIndex]
        );
      }
    }
  );

export const selectScheduledEntity = (
  id: number,
  type: string,
  recurrence_index: number | null
) =>
  createSelector(
    tasksApi.endpoints.getAllScheduledTasks.select(),
    (scheduledTasks) => {
      if (id) {
        return (
          scheduledTasks.data?.byEntityId &&
          scheduledTasks.data?.byEntityId[type] &&
          scheduledTasks.data?.byEntityId[type][id] &&
          scheduledTasks.data?.byEntityId[type][id][
            recurrence_index === null ? -1 : recurrence_index
          ]
        );
      }
    }
  );

export const selectTasksFromEntityAndHiddenTag = (
  entityId: number,
  tagName: HiddenTagType
) =>
  createSelector(tasksApi.endpoints.getAllTasks.select(), (tasks) => {
    const taskData = tasks.data;

    if (!taskData) {
      return [];
    }
    return taskData?.ids
      .filter((id) => {
        const task = taskData.byId[id];
        return task.entities.includes(entityId) && task.hidden_tag === tagName;
      })
      .map((id) => taskData.byId[id]);
  });

export const selectNextTaskFromEntityAndHiddenTag = (
  entityId: number,
  tagName: HiddenTagType
) =>
  createSelector(
    selectTasksFromEntityAndHiddenTag(entityId, tagName),
    taskCompletionFormsApi.endpoints.getTaskCompletionForms.select(),
    (tasks, taskCompletionForms) => {
      const taskCompletionFormData = taskCompletionForms.data;

      if (!taskCompletionFormData) {
        return null;
      }

      const sortedTasks = tasks.sort((taskA, taskB) => {
        const taskAStart = taskA.start_datetime || taskA.date;
        const taskBStart = taskB.start_datetime || taskB.date;
        if (!(taskAStart && taskBStart)) {
          return 0;
        }
        return taskAStart < taskBStart ? -1 : 1;
      });

      const now = new Date();
      for (const task of sortedTasks) {
        if (
          taskCompletionFormData.byTaskId[task.id] &&
          taskCompletionFormData.byTaskId[task.id][-1]?.complete
        ) {
          continue;
        }
        if (task.start_datetime && new Date(task.start_datetime) > now) {
          return task;
        }
        if (task.start_date && new Date(task.start_date) > now) {
          return task;
        }
        if (task.date && new Date(task.date) > now) {
          return task;
        }
      }

      return null;
    }
  );
