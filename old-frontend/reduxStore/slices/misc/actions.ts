import { createAction } from 'typesafe-actions';

export const setShowPremiumModal = createAction(
  '@misc/setShowPremiumModal'
)<boolean>();
