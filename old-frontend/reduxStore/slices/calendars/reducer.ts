import { CalendarState } from './types';
import { ActionType, createReducer } from 'typesafe-actions';
import * as actions from './actions';

export type CalendarAction = ActionType<typeof actions>;

const INITIAL_CALENDAR_STATE: CalendarState = {
  data: {
    filteredUsers: [],
    filteredEntities: [],
    filteredTags: [],
    filteredCategories: [],
    filteredTaskTypes: [],
    completionFilters: [],
    taskToAction: null,
    taskToPartiallyComplete: null,
    taskToReschedule: null
  },
  ui: {
    enforcedDate: '',
    actionDrawerOpen: false,
    filtersModalOpen: false,
    lastUpdateId: null
  }
};

const calendarReducer = createReducer(INITIAL_CALENDAR_STATE)
  .handleAction(
    actions.setEnforcedDate,
    (state: CalendarState, { payload }) => {
      return {
        ...state,
        ui: {
          ...state.ui,
          enforcedDate: payload.date
        }
      };
    }
  )
  .handleAction(
    actions.setLastUpdateId,
    (state: CalendarState, { payload }) => {
      return {
        ...state,
        ui: {
          ...state.ui,
          lastUpdateId: payload
        }
      };
    }
  )
  .handleAction(
    actions.setFilteredUsers,
    (state: CalendarState, { payload }) => {
      return {
        ...state,
        data: {
          ...state.data,
          filteredUsers: payload.users
        }
      };
    }
  )
  .handleAction(
    actions.setFilteredEntities,
    (state: CalendarState, { payload }) => {
      return {
        ...state,
        data: {
          ...state.data,
          filteredEntities: payload.entities
        }
      };
    }
  )
  .handleAction(
    actions.setFilteredTags,
    (state: CalendarState, { payload }) => {
      return {
        ...state,
        data: {
          ...state.data,
          filteredTags: payload.tags
        }
      };
    }
  )
  .handleAction(
    actions.setFilteredCategories,
    (state: CalendarState, { payload }) => {
      return {
        ...state,
        data: {
          ...state.data,
          filteredCategories: payload.categories
        }
      };
    }
  )
  .handleAction(
    actions.setFilteredTaskTypes,
    (state: CalendarState, { payload }) => {
      return {
        ...state,
        data: {
          ...state.data,
          filteredTaskTypes: payload.taskTypes
        }
      };
    }
  )
  .handleAction(
    actions.setCompletionFilters,
    (state: CalendarState, { payload }) => {
      return {
        ...state,
        data: {
          ...state.data,
          completionFilters: payload.completionFilters
        }
      };
    }
  )
  .handleAction(
    actions.setTaskToAction,
    (state: CalendarState, { payload }) => {
      return {
        ...state,
        data: {
          ...state.data,
          taskToAction: payload
        }
      };
    }
  )
  .handleAction(
    actions.setTaskToPartiallyComplete,
    (state: CalendarState, { payload }) => {
      return {
        ...state,
        data: {
          ...state.data,
          taskToPartiallyComplete: payload
        }
      };
    }
  )
  .handleAction(
    actions.setTaskToReschedule,
    (state: CalendarState, { payload }) => {
      return {
        ...state,
        data: {
          ...state.data,
          taskToReschedule: payload
        }
      };
    }
  )
  .handleAction(
    actions.setFiltersModalOpen,
    (state: CalendarState, { payload }) => {
      return {
        ...state,
        ui: {
          ...state.ui,
          filtersModalOpen: payload
        }
      };
    }
  );

export { calendarReducer };
