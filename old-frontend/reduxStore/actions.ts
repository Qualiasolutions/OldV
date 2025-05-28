// see: https://github.com/piotrwitek/typesafe-actions#reducers

import { AuthAction } from './slices/auth/reducer';
import { CalendarAction } from './slices/calendars/reducer';
import { ListsAction } from './slices/lists/reducer';
import { MiscAction } from './slices/misc/reducer';
import { NotificationAction } from './slices/notifications/reducer';
import { UsersAction } from './slices/users/reducer';

export type RootAction =
  | AuthAction
  | CalendarAction
  | MiscAction
  | NotificationAction
  | UsersAction
  | ListsAction;

declare module 'typesafe-actions' {
  interface Types {
    RootAction: RootAction;
  }
}
