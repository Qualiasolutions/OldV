import { combineReducers } from 'redux';
import { authReducer } from './slices/auth/reducer';
import { vuetApi } from './services/api/api';
import { logOut } from './slices/auth/actions';
import { Action, getType } from 'typesafe-actions';
import { EntireState } from './types';
import { notificationsReducer } from './slices/notifications/reducer';
import { calendarReducer } from './slices/calendars/reducer';
import { listsReducer } from './slices/lists/reducer';
import { miscReducer } from './slices/misc/reducer';
import { usersReducer } from './slices/users/reducer';

const appReducer = combineReducers({
  authentication: authReducer,
  notifications: notificationsReducer,
  calendar: calendarReducer,
  misc: miscReducer,
  lists: listsReducer,
  users: usersReducer,
  [vuetApi.reducerPath]: vuetApi.reducer
});

const rootReducer = (state: EntireState, action: Action) => {
  if (action.type === getType(logOut)) {
    state = undefined;
  }

  return appReducer(state, action);
};

export default rootReducer;
