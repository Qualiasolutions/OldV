import { createSelector } from '@reduxjs/toolkit';
import referencesApi from 'reduxStore/services/api/references';

export const selectReferenceGroupsByEntityId = (entityId: number) =>
  createSelector(
    referencesApi.endpoints.getAllReferenceGroups.select(),
    (references) => {
      const refData = references?.data;
      if (!(refData && refData.byEntity && refData.byEntity[entityId])) {
        return [];
      }
      return refData.byEntity[entityId].map((refId) => refData.byId[refId]);
    }
  );

export const selectReferenceGroupsByTagName = (tagName: string) =>
  createSelector(
    referencesApi.endpoints.getAllReferenceGroups.select(),
    (references) => {
      const refData = references?.data;
      if (!(refData && refData.byTagName && refData.byTagName[tagName])) {
        return [];
      }
      return refData.byTagName[tagName].map((refId) => refData.byId[refId]);
    }
  );

export const selectReferencesByGroupId = (groupId: number) =>
  createSelector(
    referencesApi.endpoints.getAllReferences.select(),
    (references) => {
      const refData = references?.data;
      if (!(refData && refData.byGroup && refData.byGroup[groupId])) {
        return [];
      }
      return refData.byGroup[groupId].map((refId) => refData.byId[refId]);
    }
  );

export const selectReferenceById = (id: number) =>
  createSelector(
    referencesApi.endpoints.getAllReferenceGroups.select(),
    (referenceGroups) => {
      const refGroupData = referenceGroups?.data;
      if (!(refGroupData && refGroupData.byId && refGroupData.byId[id])) {
        return null;
      }
      return refGroupData.byId[id];
    }
  );
