import {
  AllPlanningListItems,
  AllPlanningLists,
  AllPlanningSublists,
  AllShoppingListDelegations,
  AllShoppingListItems,
  AllShoppingLists,
  AllShoppingListStores,
  FormUpdateListEntryRequest,
  ListEntryResponse,
  PlanningList,
  PlanningListItem,
  PlanningSublist,
  ShoppingList,
  ShoppingListDelegation,
  ShoppingListItem,
  ShoppingListStore
} from 'types/lists';
import { normalizeData, vuetApi } from './api';
import entitiesApi from './entities';

const normalisePlanningLists = (data: PlanningList[]) => {
  return {
    ids: data.map(({ id }) => id),
    byId: data.reduce(
      (prev, next) => ({
        ...prev,
        [next.id]: next
      }),
      {}
    ),
    byCategory: data.reduce<{ [key: number]: number[] }>(
      (prev, next) => ({
        ...prev,
        [next.category]: prev[next.category]
          ? [...prev[next.category], next.id]
          : [next.id]
      }),
      {}
    )
  };
};

const normalisePlanningSublists = (data: PlanningSublist[]) => {
  return {
    ids: data.map(({ id }) => id),
    byId: data.reduce(
      (prev, next) => ({
        ...prev,
        [next.id]: next
      }),
      {}
    ),
    byList: data.reduce<{ [key: number]: number[] }>(
      (prev, next) => ({
        ...prev,
        [next.list]: prev[next.list] ? [...prev[next.list], next.id] : [next.id]
      }),
      {}
    )
  };
};

const normalisePlanningListItems = (data: PlanningListItem[]) => {
  return {
    ids: data.map(({ id }) => id),
    byId: data.reduce(
      (prev, next) => ({
        ...prev,
        [next.id]: next
      }),
      {}
    ),
    bySublist: data.reduce<{ [key: number]: number[] }>(
      (prev, next) => ({
        ...prev,
        [next.sublist]: prev[next.sublist]
          ? [...prev[next.sublist], next.id]
          : [next.id]
      }),
      {}
    )
  };
};

const normaliseShoppingListItems = (data: ShoppingListItem[]) => {
  return {
    ids: data.map(({ id }) => id),
    byId: data.reduce(
      (prev, next) => ({
        ...prev,
        [next.id]: next
      }),
      {}
    ),
    byList: data.reduce<{ [key: number]: number[] }>(
      (prev, next) => ({
        ...prev,
        [next.list]: prev[next.list] ? [...prev[next.list], next.id] : [next.id]
      }),
      {}
    ),
    byStore: data.reduce<{ [key: number]: number[] }>((prev, next) => {
      const storeId = next.store || -1;
      return {
        ...prev,
        [storeId]: prev[storeId] ? [...prev[storeId], next.id] : [next.id]
      };
    }, {})
  };
};

const listsApi = vuetApi.injectEndpoints({
  endpoints: (builder) => ({
    updateListEntry: builder.mutation<
      ListEntryResponse,
      Partial<ListEntryResponse> & Pick<ListEntryResponse, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/list-entry/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['Entity']
    }),
    formUpdateListEntry: builder.mutation<
      ListEntryResponse,
      FormUpdateListEntryRequest
    >({
      query: (payload) => ({
        url: `core/list-entry/${payload.id}/`,
        method: 'PATCH',
        headers: {
          'Content-Type': 'multipart/form-data;'
        },
        body: payload.formData
      }),
      invalidatesTags: ['Entity']
    }),
    createListEntry: builder.mutation<
      ListEntryResponse,
      Partial<Omit<ListEntryResponse, 'id'>>
    >({
      query: (body) => {
        return {
          url: 'core/list-entry/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: [],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const mockId = Math.round(1000000 * Math.random() * 1e7);
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of entitiesApi.util.selectInvalidatedBy(getState(), [
          { type: 'Entity' }
        ])) {
          if (endpointName !== 'getAllEntities') continue;
          const patchResult = dispatch(
            entitiesApi.util.updateQueryData(
              'getAllEntities',
              originalArgs,
              (draft) => {
                const listsToUpdate = Object.values(draft.byId).filter(
                  (entity) => entity.id === patch.list
                );
                for (const list of listsToUpdate) {
                  list.list_entries.push({
                    ...patch,
                    id: mockId
                  });
                }
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          const { data: newListEntry } = await queryFulfilled;
          for (const {
            endpointName,
            originalArgs
          } of entitiesApi.util.selectInvalidatedBy(getState(), [
            { type: 'Entity' }
          ])) {
            if (endpointName !== 'getAllEntities') continue;
            dispatch(
              entitiesApi.util.updateQueryData(
                'getAllEntities',
                originalArgs,
                (draft) => {
                  const listsToUpdate = Object.values(draft.byId).filter(
                    (entity) => entity.id === patch.list
                  );
                  for (const list of listsToUpdate) {
                    const mockIndex = list.list_entries
                      .map((entry) => entry.id)
                      .indexOf(mockId);
                    list.list_entries[mockIndex].id = newListEntry.id;
                  }
                }
              )
            );
          }
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    formCreateListEntry: builder.mutation<
      ListEntryResponse,
      {
        formData?: FormData;
      }
    >({
      query: (payload) => {
        return {
          url: 'core/list-entry/',
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data;'
          },
          body: payload.formData
        };
      },
      invalidatesTags: ['Entity']
    }),
    deleteListEntry: builder.mutation<void, number>({
      query: (id) => {
        return {
          url: `core/list-entry/${id}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: [],
      async onQueryStarted(idToDelete, { dispatch, queryFulfilled, getState }) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of entitiesApi.util.selectInvalidatedBy(getState(), [
          { type: 'Entity' }
        ])) {
          if (endpointName !== 'getAllEntities') continue;
          const patchResult = dispatch(
            entitiesApi.util.updateQueryData(
              'getAllEntities',
              originalArgs,
              (draft) => {
                const listsToUpdate = Object.values(draft.byId).filter(
                  (entity: any) => {
                    if (entity.resourcetype !== 'List') {
                      return false;
                    }
                    const listEntryIds = entity.list_entries.map(
                      (list: any) => list.id
                    );
                    return listEntryIds.includes(idToDelete);
                  }
                );
                for (const list of listsToUpdate) {
                  list.list_entries = list.list_entries.filter(
                    (listEntry: any) => listEntry.id !== idToDelete
                  );
                }
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    getAllPlanningLists: builder.query<AllPlanningLists, void>({
      query: () => ({
        url: 'core/planning-list/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: PlanningList[] = await response.json();
            return normalisePlanningLists(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['PlanningList']
    }),
    getAllPlanningListTemplates: builder.query<AllPlanningLists, void>({
      query: () => ({
        url: 'core/planning-list-template/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: PlanningList[] = await response.json();
            return normalisePlanningLists(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['PlanningList']
    }),
    createPlanningListTemplate: builder.mutation<
      {
        id: number;
      },
      {
        title: string;
        list: number;
        from_template?: boolean;
      }
    >({
      query: (body) => {
        return {
          url: 'core/planning-lists/create_template/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['PlanningList', 'PlanningSublist', 'PlanningListItem']
    }),
    createPlanningListFromDefaultTemplate: builder.mutation<
      {
        id: number;
      },
      {
        title: string;
        list_template: string;
      }
    >({
      query: (body) => {
        return {
          url: 'core/planning-lists/create_from_default_template/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['PlanningList', 'PlanningSublist', 'PlanningListItem']
    }),
    createPlanningList: builder.mutation<
      PlanningList,
      Omit<PlanningList, 'id'>
    >({
      query: (body) => {
        return {
          url: 'core/planning-list/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['PlanningList', 'PlanningSublist'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'PlanningList' }
        ])) {
          if (endpointName !== 'getAllPlanningLists') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllPlanningLists',
              originalArgs,
              (draft) => {
                const mockId = Math.round(1000000 * Math.random() * 1e7);
                draft.ids.push(mockId);
                draft.byId[mockId] = { ...patch, id: mockId };

                const byCat = draft.byCategory[patch.category];
                draft.byCategory[patch.category] = byCat
                  ? [...byCat, mockId]
                  : [mockId];
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    deletePlanningList: builder.mutation<void, number>({
      query: (listId) => {
        return {
          url: `core/planning-list/${listId}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['PlanningList'],
      async onQueryStarted(listId, { dispatch, queryFulfilled, getState }) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'PlanningList' }
        ])) {
          if (endpointName !== 'getAllPlanningLists') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllPlanningLists',
              originalArgs,
              (draft) => {
                const cat = draft.byId[listId].category;

                draft.ids = draft.ids.filter((id) => id !== listId);
                delete draft.byId[listId];

                const byCat = draft.byCategory[cat];
                draft.byCategory[cat] = byCat.filter((id) => id !== listId);
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    updatePlanningList: builder.mutation<
      PlanningList,
      Partial<PlanningList> & Pick<PlanningList, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/planning-list/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['PlanningList'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'PlanningList' }
        ])) {
          if (endpointName !== 'getAllPlanningLists') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllPlanningLists',
              originalArgs,
              (draft) => {
                draft.byId[patch.id] = {
                  ...draft.byId[patch.id],
                  ...patch
                };
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    getAllPlanningSublists: builder.query<AllPlanningSublists, void>({
      query: () => ({
        url: 'core/planning-sublist/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: PlanningSublist[] = await response.json();
            return normalisePlanningSublists(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['PlanningSublist']
    }),
    createPlanningSublist: builder.mutation<
      PlanningSublist,
      Omit<PlanningSublist, 'id'>
    >({
      query: (body) => {
        return {
          url: 'core/planning-sublist/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['PlanningSublist'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'PlanningSublist' }
        ])) {
          if (endpointName !== 'getAllPlanningSublists') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllPlanningSublists',
              originalArgs,
              (draft) => {
                const mockId = Math.round(1000000 * Math.random() * 1e7);
                draft.ids.push(mockId);
                draft.byId[mockId] = { ...patch, id: mockId };

                const byList = draft.byList[patch.list];
                draft.byList[patch.list] = byList
                  ? [...byList, mockId]
                  : [mockId];
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    updatePlanningSublist: builder.mutation<
      PlanningSublist,
      Partial<PlanningSublist> & Pick<PlanningSublist, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/planning-sublist/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['PlanningSublist'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'PlanningSublist' }
        ])) {
          if (endpointName !== 'getAllPlanningSublists') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllPlanningSublists',
              originalArgs,
              (draft) => {
                draft.byId[patch.id] = {
                  ...draft.byId[patch.id],
                  ...patch
                };
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    deletePlanningSublist: builder.mutation<void, number>({
      query: (sublistId) => {
        return {
          url: `core/planning-sublist/${sublistId}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['PlanningSublist'],
      async onQueryStarted(sublistId, { dispatch, queryFulfilled, getState }) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'PlanningSublist' }
        ])) {
          if (endpointName !== 'getAllPlanningSublists') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllPlanningSublists',
              originalArgs,
              (draft) => {
                const list = draft.byId[sublistId].list;

                draft.ids = draft.ids.filter((id) => id !== sublistId);
                delete draft.byId[sublistId];

                const byList = draft.byList[list];
                draft.byList[list] = byList.filter((id) => id !== sublistId);
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    getAllPlanningListItems: builder.query<AllPlanningListItems, void>({
      query: () => ({
        url: 'core/planning-list-item/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: PlanningListItem[] = await response.json();
            return normalisePlanningListItems(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['PlanningListItem']
    }),
    createPlanningListItem: builder.mutation<
      PlanningListItem,
      Omit<PlanningListItem, 'id' | 'checked'>
    >({
      query: (body) => {
        return {
          url: 'core/planning-list-item/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['PlanningListItem'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'PlanningListItem' }
        ])) {
          if (endpointName !== 'getAllPlanningListItems') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllPlanningListItems',
              originalArgs,
              (draft) => {
                const mockId = Math.round(1000000 * Math.random() * 1e7);
                draft.ids.push(mockId);
                draft.byId[mockId] = { ...patch, id: mockId, checked: false };

                const bySublist = draft.bySublist[patch.sublist];
                draft.bySublist[patch.sublist] = bySublist
                  ? [...bySublist, mockId]
                  : [mockId];
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    deletePlanningListItem: builder.mutation<void, number>({
      query: (itemId) => {
        return {
          url: `core/planning-list-item/${itemId}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['PlanningListItem'],
      async onQueryStarted(itemId, { dispatch, queryFulfilled, getState }) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'PlanningListItem' }
        ])) {
          if (endpointName !== 'getAllPlanningListItems') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllPlanningListItems',
              originalArgs,
              (draft) => {
                const sublist = draft.byId[itemId].sublist;

                draft.ids = draft.ids.filter((id) => id !== itemId);
                delete draft.byId[itemId];

                const bySublist = draft.bySublist[sublist];
                draft.bySublist[sublist] = bySublist.filter(
                  (id) => id !== itemId
                );
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    updatePlanningListItem: builder.mutation<
      PlanningListItem,
      Partial<PlanningListItem> & Pick<PlanningListItem, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/planning-list-item/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['PlanningListItem'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'PlanningListItem' }
        ])) {
          if (endpointName !== 'getAllPlanningListItems') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllPlanningListItems',
              originalArgs,
              (draft) => {
                draft.byId[patch.id] = {
                  ...draft.byId[patch.id],
                  ...patch
                };
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    getAllShoppingLists: builder.query<AllShoppingLists, void>({
      query: () => ({
        url: 'core/shopping-list/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: ShoppingList[] = await response.json();
            return normalizeData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['ShoppingList']
    }),
    createShoppingList: builder.mutation<
      ShoppingList,
      Omit<ShoppingList, 'id'>
    >({
      query: (body) => {
        return {
          url: 'core/shopping-list/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['ShoppingList'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'ShoppingList' }
        ])) {
          if (endpointName !== 'getAllShoppingLists') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllShoppingLists',
              originalArgs,
              (draft) => {
                const mockId = Math.round(1000000 * Math.random() * 1e7);
                draft.ids.push(mockId);
                draft.byId[mockId] = { ...patch, id: mockId };
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    deleteShoppingList: builder.mutation<void, number>({
      query: (listId) => {
        return {
          url: `core/shopping-list/${listId}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['ShoppingList'],
      async onQueryStarted(listId, { dispatch, queryFulfilled, getState }) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'ShoppingList' }
        ])) {
          if (endpointName !== 'getAllShoppingLists') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllShoppingLists',
              originalArgs,
              (draft) => {
                draft.ids = draft.ids.filter((id) => id !== listId);
                delete draft.byId[listId];
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    updateShoppingList: builder.mutation<
      ShoppingList,
      Partial<ShoppingList> & Pick<ShoppingList, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/shopping-list/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['ShoppingList'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'ShoppingList' }
        ])) {
          if (endpointName !== 'getAllShoppingLists') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllShoppingLists',
              originalArgs,
              (draft) => {
                draft.byId[patch.id] = {
                  ...draft.byId[patch.id],
                  ...patch
                };
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    getAllShoppingListItems: builder.query<AllShoppingListItems, void>({
      query: () => ({
        url: 'core/shopping-list-item/',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: ShoppingListItem[] = await response.json();
            return normaliseShoppingListItems(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['ShoppingListItem']
    }),
    createShoppingListItem: builder.mutation<
      ShoppingListItem,
      Omit<ShoppingListItem, 'id' | 'checked'>
    >({
      query: (body) => {
        return {
          url: 'core/shopping-list-item/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['ShoppingListItem'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'ShoppingListItem' }
        ])) {
          if (endpointName !== 'getAllShoppingListItems') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllShoppingListItems',
              originalArgs,
              (draft) => {
                const mockId = Math.round(1000000 * Math.random() * 1e7);
                draft.ids.push(mockId);
                draft.byId[mockId] = { ...patch, id: mockId, checked: false };

                const byList = draft.byList[patch.list];
                draft.byList[patch.list] = byList
                  ? [...byList, mockId]
                  : [mockId];

                const store = patch.store || -1;
                const byStore = draft.byStore[store];
                draft.byStore[store] = byStore
                  ? [...byStore, mockId]
                  : [mockId];
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    deleteShoppingListItem: builder.mutation<void, number>({
      query: (itemId) => {
        return {
          url: `core/shopping-list-item/${itemId}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['ShoppingListItem'],
      async onQueryStarted(itemId, { dispatch, queryFulfilled, getState }) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'ShoppingListItem' }
        ])) {
          if (endpointName !== 'getAllShoppingListItems') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllShoppingListItems',
              originalArgs,
              (draft) => {
                const list = draft.byId[itemId].list;
                const store = draft.byId[itemId].store || -1;

                draft.ids = draft.ids.filter((id) => id !== itemId);
                delete draft.byId[itemId];

                const byList = draft.byList[list];
                draft.byList[list] = byList.filter((id) => id !== itemId);

                const byStore = draft.byStore[store];
                draft.byStore[store] = byStore.filter((id) => id !== itemId);
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    updateShoppingListItem: builder.mutation<
      ShoppingListItem,
      Partial<ShoppingListItem> & Pick<ShoppingListItem, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/shopping-list-item/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['ShoppingListItem'],
      async onQueryStarted(
        { ...patch },
        { dispatch, queryFulfilled, getState }
      ) {
        const patchResults = [];
        for (const {
          endpointName,
          originalArgs
        } of listsApi.util.selectInvalidatedBy(getState(), [
          { type: 'ShoppingListItem' }
        ])) {
          if (endpointName !== 'getAllShoppingListItems') continue;
          const patchResult = dispatch(
            listsApi.util.updateQueryData(
              'getAllShoppingListItems',
              originalArgs,
              (draft) => {
                draft.byId[patch.id] = {
                  ...draft.byId[patch.id],
                  ...patch
                };
              }
            )
          );
          patchResults.push(patchResult);
        }
        try {
          await queryFulfilled;
        } catch {
          for (const patchResult of patchResults) {
            patchResult.undo();
          }
        }
      }
    }),
    createShoppingListStore: builder.mutation<
      ShoppingListStore,
      Omit<ShoppingListStore, 'id'>
    >({
      query: (body) => {
        return {
          url: 'core/shopping-list-store/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['ShoppingListStore']
    }),
    updateShoppingListStore: builder.mutation<
      ShoppingListStore,
      Partial<ShoppingListStore> & Pick<ShoppingListStore, 'id'>
    >({
      query: (body) => {
        return {
          url: `core/shopping-list-store/${body.id}/`,
          method: 'PATCH',
          body
        };
      },
      invalidatesTags: ['ShoppingListStore']
    }),
    deleteShoppingListStore: builder.mutation<void, number>({
      query: (itemId) => {
        return {
          url: `core/shopping-list-store/${itemId}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['ShoppingListStore']
    }),
    getAllShoppingListStores: builder.query<AllShoppingListStores, void>({
      query: () => ({
        url: 'core/shopping-list-store/',
        method: 'GET',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: ShoppingListStore[] = await response.json();
            return normalizeData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['ShoppingListStore']
    }),
    getAllStoreDelegations: builder.query<AllShoppingListDelegations, void>({
      query: () => ({
        url: 'core/shopping-list-delegation/',
        method: 'GET',
        responseHandler: async (response) => {
          if (response.ok) {
            const responseJson: ShoppingListDelegation[] =
              await response.json();
            return normalizeData(responseJson);
          } else {
            // Just return the error data
            return response.json();
          }
        }
      }),
      providesTags: ['ShoppingListDelegation']
    }),
    createStoreDelegations: builder.mutation<
      ShoppingListDelegation[],
      Omit<ShoppingListDelegation, 'id' | 'store_name' | 'list_name'>[]
    >({
      query: (body) => {
        return {
          url: 'core/shopping-list-delegation/',
          method: 'POST',
          body
        };
      },
      invalidatesTags: ['ShoppingListDelegation']
    }),
    deleteStoreDelegation: builder.mutation<void, number>({
      query: (delegationId) => {
        return {
          url: `core/shopping-list-delegation/${delegationId}/`,
          method: 'DELETE'
        };
      },
      invalidatesTags: ['ShoppingListDelegation']
    }),
    getAllDelegatedShoppingListItems: builder.query<AllShoppingListItems, void>(
      {
        query: () => ({
          url: 'core/delegated-shopping-list-item/',
          responseHandler: async (response) => {
            if (response.ok) {
              const responseJson: ShoppingListItem[] = await response.json();
              return normaliseShoppingListItems(responseJson);
            } else {
              // Just return the error data
              return response.json();
            }
          }
        }),
        providesTags: ['ShoppingListItem']
      }
    ),
    updateDelegatedShoppingListItems: builder.mutation<
      ShoppingListItem,
      { id: number; checked: boolean }
    >({
      query: ({ id, checked }) => {
        return {
          url: `core/delegated-shopping-list-item/${id}/`,
          method: 'PATCH',
          body: {
            checked
          }
        };
      },
      invalidatesTags: ['ShoppingListItem']
    })
  }),
  overrideExisting: true
});

export default listsApi;

// Export hooks for usage in functional components, which are
// auto-generated based on the defined endpoints
export const {
  useUpdateListEntryMutation,
  useCreateListEntryMutation,
  useFormCreateListEntryMutation,
  useDeleteListEntryMutation,
  useFormUpdateListEntryMutation,
  useGetAllPlanningListsQuery,
  useGetAllPlanningListTemplatesQuery,
  useCreatePlanningListTemplateMutation,
  useCreatePlanningListFromDefaultTemplateMutation,
  useCreatePlanningListMutation,
  useDeletePlanningListMutation,
  useUpdatePlanningListMutation,
  useGetAllPlanningSublistsQuery,
  useCreatePlanningSublistMutation,
  useDeletePlanningSublistMutation,
  useUpdatePlanningSublistMutation,
  useGetAllPlanningListItemsQuery,
  useCreatePlanningListItemMutation,
  useDeletePlanningListItemMutation,
  useUpdatePlanningListItemMutation,
  useGetAllShoppingListsQuery,
  useCreateShoppingListMutation,
  useDeleteShoppingListMutation,
  useUpdateShoppingListMutation,
  useGetAllShoppingListItemsQuery,
  useCreateShoppingListItemMutation,
  useDeleteShoppingListItemMutation,
  useUpdateShoppingListItemMutation,
  useGetAllShoppingListStoresQuery,
  useCreateShoppingListStoreMutation,
  useUpdateShoppingListStoreMutation,
  useDeleteShoppingListStoreMutation,
  useGetAllStoreDelegationsQuery,
  useCreateStoreDelegationsMutation,
  useDeleteStoreDelegationMutation,
  useGetAllDelegatedShoppingListItemsQuery,
  useUpdateDelegatedShoppingListItemsMutation
} = listsApi;
