import { NotificationState } from './types';
import { ActionType, createReducer } from 'typesafe-actions';
import * as actions from './actions';

export type NotificationAction = ActionType<typeof actions>;

const INITIAL_NOTIFICATION_STATE: NotificationState = {
  pushToken: ''
};

const notificationsReducer = createReducer(
  INITIAL_NOTIFICATION_STATE
).handleAction(
  actions.setPushToken,
  (state: NotificationState, action: { payload: string }) => {
    return {
      ...state,
      pushToken: action.payload
    };
  }
);

export { notificationsReducer };
