import { AuthState } from './types';
import { ActionType, createReducer } from 'typesafe-actions';
import * as actions from './actions';

export type AuthAction = ActionType<typeof actions>;

const INITIAL_AUTH_STATE: AuthState = {
  username: '',
  jwtAccessToken: '',
  jwtRefreshToken: ''
};

const authReducer = createReducer(INITIAL_AUTH_STATE)
  .handleAction(
    actions.setAccessToken,
    (state: AuthState, action: { payload: string }) => ({
      ...state,
      jwtAccessToken: action.payload
    })
  )
  .handleAction(
    actions.setRefreshToken,
    (state: AuthState, action: { payload: string }) => ({
      ...state,
      jwtRefreshToken: action.payload
    })
  )
  .handleAction(actions.logOut, (state: AuthState) => ({
    ...state,
    username: '',
    jwtAccessToken: '',
    jwtRefreshToken: ''
  }));

export { authReducer };
