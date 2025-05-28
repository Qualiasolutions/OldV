import { createSelector } from '@reduxjs/toolkit';
import timeBlocksApi from 'reduxStore/services/api/timeblocks';

export const selectTimeBlockById = (id: number) =>
  createSelector(timeBlocksApi.endpoints.getAllTimeBlocks.select(), (timeBlocks) => {
    return timeBlocks.data?.byId[id];
  });
