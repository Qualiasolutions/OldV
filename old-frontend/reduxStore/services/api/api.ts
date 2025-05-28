import { createApi } from '@reduxjs/toolkit/query/react';

import customFetchBase from './customFetchBase';

export const normalizeData = (data: { id: number }[]) => {
  return {
    ids: data.map(({ id }) => id),
    byId: data.reduce(
      (prev, next) => ({
        ...prev,
        [next.id]: next
      }),
      {}
    )
  };
};

// Define a service using a base URL and expected endpoints
export const vuetApi = createApi({
  reducerPath: 'vuetApi',
  tagTypes: [
    'Alert',
    'ActionAlert',
    'CategorySetupCompletion',
    'ReferencesSetupCompletion',
    'EntityTypeSetupCompletion',
    'LinkListSetupCompletion',
    'TagSetupCompletion',
    'Entity',
    'Task',
    'TaskLimit',
    'TaskAction',
    'TaskCompletionForm',
    'Category',
    'ProfessionalCategory',
    'User',
    'UserInvite',
    'Family',
    'PushToken',
    'Country',
    'GuestListInvite',
    'Holiday',
    'ICalIntegration',
    'Friendships',
    'FamilyCategoryViewPermission',
    'PreferredDays',
    'BlockedCategories',
    'Reference',
    'Routine',
    'Tag',
    'TimeBlock',
    'LastActivityView',
    'Message',
    'PlanningList',
    'PlanningSublist',
    'PlanningListItem',
    'ShoppingList',
    'ShoppingListItem',
    'ShoppingListStore',
    'ShoppingListDelegation',
    'SchoolYear',
    'SchoolTerm',
    'SchoolBreak',
    'Subscription'
  ],
  baseQuery: customFetchBase,
  endpoints: (builder) => ({})
});
