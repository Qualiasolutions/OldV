import { UserFullResponse } from 'types/users';
import { createAction } from 'typesafe-actions';

export const setUserFullDetails = createAction(
  '@users/setUserFullDetails'
)<UserFullResponse | null>();

export const setLoadingUserDetails = createAction(
  '@users/setLoadingUserDetails'
)<boolean>();
