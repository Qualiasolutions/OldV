import { createSelector } from '@reduxjs/toolkit';
import routinesApi from 'reduxStore/services/api/routines';

export const selectRoutineById = (id: number) =>
  createSelector(routinesApi.endpoints.getAllRoutines.select(), (routines) => {
    return routines.data?.byId[id];
  });
