import { ActionType, createReducer } from 'typesafe-actions';
import * as actions from './actions';
import { ListsState } from './types';

export type ListsAction = ActionType<typeof actions>;

const INITIAL_LISTS_STATE: ListsState = {
  data: {
    listItemToAction: null
  }
};

const listsReducer = createReducer(INITIAL_LISTS_STATE).handleAction(
  actions.setListItemToAction,
  (state: ListsState, { payload }) => {
    return {
      ...state,
      data: {
        ...state.data,
        listItemToAction: payload
      }
    };
  }
);

export { listsReducer };
