import { UserState } from './types';
import { ActionType, createReducer } from 'typesafe-actions';
import * as actions from './actions';

export type UsersAction = ActionType<typeof actions>;

const INITIAL_USERS_STATE: UserState = {
  data: {
    user: null,
    isLoadingUser: false
  }
};

const usersReducer = createReducer(INITIAL_USERS_STATE)
  .handleAction(
    actions.setUserFullDetails,
    (state: UserState, { payload: user }) => {
      return {
        ...state,
        data: {
          ...state.data,
          user
        }
      };
    }
  )
  .handleAction(
    actions.setLoadingUserDetails,
    (state: UserState, { payload: val }) => {
      return {
        ...state,
        data: {
          ...state.data,
          isLoadingUser: val
        }
      };
    }
  );

export { usersReducer };
