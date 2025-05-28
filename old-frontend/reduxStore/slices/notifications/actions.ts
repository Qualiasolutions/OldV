import { SET_PUSH_TOKEN } from './actionNames';
import { createAction } from 'typesafe-actions';

const setPushToken = createAction(SET_PUSH_TOKEN)<string>();

export { setPushToken };
