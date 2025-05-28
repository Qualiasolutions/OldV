import { createSelector } from '@reduxjs/toolkit';
import userApi from 'reduxStore/services/api/user';
import { EntireState } from 'reduxStore/types';
import { UserState } from './types';

export const selectCurrentUserId = createSelector(
  userApi.endpoints.getUserDetails.select(),
  (user) => user.data?.user_id
);

export const selectUserFromId = (userId: number) =>
  createSelector(
    userApi.endpoints.getUserFullDetails.select(userId),
    (user) => {
      return user.data;
    }
  );

export const selectFamilyMemberFromId = (
  userId: number,
  familyMemberId: number
) =>
  createSelector(
    userApi.endpoints.getUserFullDetails.select(userId),
    (user) => {
      return user.data?.family.users.find(
        (familyMember) => familyMember.id === familyMemberId
      );
    }
  );

export const selectUsersState = (state: EntireState): UserState | undefined =>
  state?.users;

export const selectReduxUserDetails = createSelector(
  selectUsersState,
  (users) => users?.data.user
);

export const selectLoadingReduxUserDetails = createSelector(
  selectUsersState,
  (users) => users?.data.isLoadingUser
);
