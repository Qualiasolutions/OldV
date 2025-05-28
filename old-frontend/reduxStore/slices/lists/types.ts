import { PlanningListItem, ShoppingListItem } from 'types/lists';

export type ListsState = {
  data: {
    listItemToAction: PlanningListItem | ShoppingListItem | null;
  };
};
