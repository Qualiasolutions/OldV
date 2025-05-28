import { PlanningListItem, ShoppingListItem } from 'types/lists';
import { createAction } from 'typesafe-actions';

export const setListItemToAction = createAction('@lists/setListItemToAction')<
  PlanningListItem | ShoppingListItem | null
>();
