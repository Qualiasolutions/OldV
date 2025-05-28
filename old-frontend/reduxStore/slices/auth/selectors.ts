import { Selector } from 'react-redux';
import { AuthState } from './types';
import { EntireState } from '../../types';
import { createSelector } from '@reduxjs/toolkit';

export const selectAuthState = (state: EntireState): AuthState | undefined =>
  state?.authentication;

export const selectAccessToken: Selector<EntireState, string> = createSelector(
  selectAuthState,
  (auth: AuthState | undefined) => auth?.jwtAccessToken || ''
);

export const selectRefreshToken: Selector<EntireState, string> = createSelector(
  selectAuthState,
  (auth: AuthState | undefined) => auth?.jwtRefreshToken || ''
);
