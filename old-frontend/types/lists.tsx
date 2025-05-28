import { Id } from '@reduxjs/toolkit/dist/query/tsHelpers';
import { BaseEntityType } from './entities';

export type ListEntryResponse = {
  id: number;
  list: number;
  title: string;
  selected: boolean;
  image: string;
  notes: string;
  phone_number: string;
  image_200_200: string;
  presigned_image_url: string;
  presigned_image_url_large: string;
};

export type ListEntryCreateRequest = {
  list: number;
  title?: string;
  selected?: boolean;
  image?: string;
  notes?: string;
  phone_number?: string;
};

export type ListEntryUpdateRequest = {
  id: number;
  list?: number;
  title?: string;
  selected?: boolean;
  image?: string;
  notes?: string;
  phone_number?: string;
};

export type FormUpdateListEntryRequest = {
  id: number;
  formData?: FormData;
};

export type PlanningList = {
  id: number;
  category: number;
  name: string;
  members: number[];
};

export type AllPlanningLists = {
  ids: number[];
  byId: {
    [key: number]: PlanningList;
  };
  byCategory: {
    [key: number]: number[];
  };
};

export type ShoppingList = {
  id: number;
  name: string;
  members: number[];
};

export type AllShoppingLists = {
  ids: number[];
  byId: {
    [key: number]: ShoppingList;
  };
};

export type PlanningSublist = {
  id: number;
  list: number;
  title: string;
};

export type AllPlanningSublists = {
  ids: number[];
  byId: {
    [key: number]: PlanningSublist;
  };
  byList: {
    [key: number]: number[];
  };
};

export type PlanningListItem = {
  id: number;
  sublist: number;
  title: string;
  checked: boolean;
};

export type AllPlanningListItems = {
  ids: number[];
  byId: {
    [key: number]: PlanningListItem;
  };
  bySublist: {
    [key: number]: number[];
  };
};

export type ShoppingListItem = {
  id: number;
  list: number;
  store: number | null;
  title: string;
  checked: boolean;
};

export type AllShoppingListItems = {
  ids: number[];
  byId: {
    [key: number]: ShoppingListItem;
  };
  byList: {
    [key: number]: number[];
  };
  byStore: {
    [key: number]: number[];
  };
};

export type ShoppingListStore = {
  id: number;
  name: string;
  created_by: number;
};

export type AllShoppingListStores = {
  ids: number[];
  byId: { [key: number]: ShoppingListStore };
};

export type ShoppingListDelegation = {
  id: number;
  delegator: number;
  delegatee: number;
  store: number;
  list: number;
  store_name: string;
  list_name: string;
};

export type AllShoppingListDelegations = {
  ids: number[];
  byId: {
    [key: number]: ShoppingListDelegation;
  };
};
