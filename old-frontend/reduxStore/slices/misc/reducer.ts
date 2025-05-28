import { MiscState } from './types';
import { ActionType, createReducer } from 'typesafe-actions';
import * as actions from './actions';

export type MiscAction = ActionType<typeof actions>;

const INITIAL_MISC_STATE: MiscState = {
  ui: {
    showPremiumModal: false
  }
};

const miscReducer = createReducer(INITIAL_MISC_STATE).handleAction(
  actions.setShowPremiumModal,
  (state: MiscState, { payload }) => {
    return {
      ...state,
      ui: {
        ...state.ui,
        showPremiumModal: payload
      }
    };
  }
);

export { miscReducer };
