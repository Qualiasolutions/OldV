import { createSelector } from '@reduxjs/toolkit';
import externalCalendarsApi from 'reduxStore/services/api/externalCalendars';

export const selectIntegrationById = (id: number) =>
  createSelector(
    externalCalendarsApi.endpoints.getICalIntegrations.select(),
    (integrations) => {
      return integrations.data?.byId && integrations.data?.byId[id];
    }
  );
