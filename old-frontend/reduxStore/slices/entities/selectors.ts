import { createSelector } from '@reduxjs/toolkit';
import entitiesApi from 'reduxStore/services/api/entities';
import taskCompletionFormsApi from 'reduxStore/services/api/taskCompletionForms';
import { EntityTypeName } from 'types/entities';

export const selectEntityById = (entityId: number) =>
  createSelector(entitiesApi.endpoints.getAllEntities.select(), (entities) => {
    const entityData = entities?.data;
    if (!entityData) {
      return null;
    }
    return entityData.byId[entityId];
  });

export const selectMemberEntityById = (entityId: number) =>
  createSelector(
    entitiesApi.endpoints.getMemberEntities.select(),
    (entities) => {
      const entityData = entities?.data;
      if (!entityData) {
        return null;
      }
      return entityData.byId[entityId];
    }
  );

export const selectNewEntityIds = createSelector(
  entitiesApi.endpoints.getAllEntities.select(),
  (entities) => {
    const entityData = entities?.data;
    if (!entityData) {
      return [];
    }
    const reverseSortedIds = [...entityData.ids].sort((a, b) =>
      a < b ? 1 : -1
    );
    const newIds = [];

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    for (const id of reverseSortedIds) {
      if (new Date(entityData.byId[id].created_at) > threeDaysAgo) {
        newIds.push(id);
        continue;
      }
      // If the latest ID is not new then neathir is anything older
      return newIds;
    }
    return newIds;
  }
);

export const selectEntitiesByEntityTypes = (entityTypes: EntityTypeName[]) =>
  createSelector(entitiesApi.endpoints.getAllEntities.select(), (entities) => {
    const entityData = entities?.data;
    if (!entityData) {
      return [];
    }

    return entityData.ids.filter((id) => {
      const entity = entityData.byId[id];
      return entityTypes.includes(entity.resourcetype);
    });
  });

export const selectEntitiesByProfessionalCategory = (
  categoryId: number | null
) =>
  createSelector(entitiesApi.endpoints.getAllEntities.select(), (entities) => {
    const entityData = entities?.data;
    if (!entityData) {
      return [];
    }

    return entityData.ids.filter((id) => {
      const entity = entityData.byId[id];
      return entity.professional_category === categoryId;
    });
  });

export const selectNewTaskCompletionFormIds = createSelector(
  taskCompletionFormsApi.endpoints.getTaskCompletionForms.select(),
  (completionForms) => {
    const taskFormData = completionForms?.data;
    if (!taskFormData) {
      return [];
    }
    const reverseSortedIds = [...taskFormData.ids].sort((a, b) =>
      a < b ? 1 : -1
    );
    const newIds = [];

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    for (const id of reverseSortedIds) {
      if (new Date(taskFormData.byId[id].completion_datetime) > threeDaysAgo) {
        newIds.push(id);
        continue;
      }
      // If the latest ID is not new then neathir is anything older
      return newIds;
    }
    return newIds;
  }
);
