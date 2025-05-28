import { createSelector } from '@reduxjs/toolkit';
import listsApi from 'reduxStore/services/api/lists';
import { EntireState } from 'reduxStore/types';
import { ListsState } from './types';

export const selectListsState = (state: EntireState): ListsState | undefined =>
  state?.lists;

export const selectListItemToAction = createSelector(
  selectListsState,
  (lists: ListsState | undefined) => lists?.data?.listItemToAction
);

export const selectListsForStoreId = (storeId: number) =>
  createSelector(
    listsApi.endpoints.getAllShoppingListItems.select(),
    (listItems) => {
      const listItemsData = listItems.data;
      if (!listItemsData) {
        return [];
      }
      const storeItemIds = listItemsData.byStore[storeId];
      const listIds = [
        ...new Set(storeItemIds.map((id) => listItemsData.byId[id].list))
      ];

      return listIds;
    }
  );

export const selectListById = (listId: number) =>
  createSelector(
    listsApi.endpoints.getAllShoppingLists.select(),
    (shoppingLists) => {
      const shoppingListData = shoppingLists.data;
      if (!shoppingListData) {
        return null;
      }
      return shoppingListData.byId[listId];
    }
  );
