import { createSelector } from '@reduxjs/toolkit';
import entitiesApi from 'reduxStore/services/api/entities';
import guestListInvitesApi from 'reduxStore/services/api/guestListInvites';
import taskCompletionFormsApi from 'reduxStore/services/api/taskCompletionForms';
import tasksApi from 'reduxStore/services/api/tasks';
import userApi from 'reduxStore/services/api/user';
import { EntireState } from 'reduxStore/types';
import {
  selectNewEntityIds,
  selectNewTaskCompletionFormIds
} from '../entities/selectors';
import { selectNewTaskIds } from '../tasks/selectors';
import { MiscState } from './types';

export const selectMiscState = (state: EntireState): MiscState | undefined =>
  state?.misc;

export const selectShowPremiumModal = createSelector(
  selectMiscState,
  (misc: MiscState | undefined) => misc?.ui?.showPremiumModal
);

export const selectHasUnrespondedEvent = createSelector(
  guestListInvitesApi.endpoints.getGuestListInviteeInvites.select(),
  (guestListInvites) => {
    const guestListInvitesData = guestListInvites.data;

    if (!guestListInvitesData) {
      return false;
    }

    return (
      guestListInvitesData.filter(
        (invite) => !invite.accepted && !invite.rejected && !invite.maybe
      ).length > 0
    );
  }
);

export const selectHasUnseenActivity = createSelector(
  selectNewTaskCompletionFormIds,
  selectNewTaskIds,
  selectNewEntityIds,
  taskCompletionFormsApi.endpoints.getTaskCompletionForms.select(),
  tasksApi.endpoints.getAllTasks.select(),
  entitiesApi.endpoints.getAllEntities.select(),
  userApi.endpoints.getLastActivityView.select(),
  (
    newTaskCompletionFormIds,
    newTaskIds,
    newEntityIds,
    taskCompletionForms,
    tasks,
    entities,
    lastActivityView
  ) => {
    const taskCompletionFormsData = taskCompletionForms?.data;
    const tasksData = tasks?.data;
    const entitiesData = entities?.data;
    const lastActivityViewData = lastActivityView?.data;

    const latestForm =
      taskCompletionFormsData?.byId[newTaskCompletionFormIds[0]];
    const latestTask = tasksData?.byId[newTaskIds[0]];
    const latestEntity = entitiesData?.byId[newEntityIds[0]];

    if (lastActivityView.isLoading) {
      return false;
    }

    if (!lastActivityViewData) {
      return !!(latestForm || latestTask || latestEntity);
    }

    let mostRecentActivity: string | null = null;
    if (latestForm) {
      mostRecentActivity = latestForm.completion_datetime;
    }
    if (latestTask) {
      if (!mostRecentActivity || latestTask.created_at > mostRecentActivity) {
        mostRecentActivity = latestTask.created_at;
      }
    }
    if (latestEntity) {
      if (!mostRecentActivity || latestEntity.created_at > mostRecentActivity) {
        mostRecentActivity = latestEntity.created_at;
      }
    }

    return (
      !mostRecentActivity || lastActivityViewData.timestamp < mostRecentActivity
    );
  }
);
