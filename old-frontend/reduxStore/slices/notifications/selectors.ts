import { Selector } from 'react-redux';
import { NotificationState } from './types';
import { EntireState } from '../../types';
import { createSelector } from '@reduxjs/toolkit';

export const selectNotificationState = (
  state: EntireState
): NotificationState | undefined => state?.notifications;

export const selectPushToken: Selector<EntireState, string | undefined> =
  createSelector(
    selectNotificationState,
    (notifications: NotificationState | undefined) => notifications?.pushToken
  );
