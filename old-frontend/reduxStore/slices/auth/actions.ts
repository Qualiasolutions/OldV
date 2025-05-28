import {
  SET_ACCESS_TOKEN,
  SET_REFRESH_TOKEN,
  SET_USERNAME,
  LOGOUT
} from './actionNames';
import { createAction } from 'typesafe-actions';

const setAccessToken = createAction(SET_ACCESS_TOKEN)<string>();
const setRefreshToken = createAction(SET_REFRESH_TOKEN)<string>();
const logOut = createAction(LOGOUT)<void>();

export { setAccessToken, setRefreshToken, logOut };
