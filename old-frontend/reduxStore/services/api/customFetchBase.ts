import {
  fetchBaseQuery,
  FetchBaseQueryError,
  FetchArgs,
  BaseQueryFn
} from '@reduxjs/toolkit/query/react';
import { Mutex } from 'async-mutex';
import {
  logOut,
  setAccessToken,
  setRefreshToken
} from 'reduxStore/slices/auth/actions';
import Constants from 'expo-constants';
import { EntireState } from 'reduxStore/types';
import { refreshTokenAsync, verifyTokenAsync } from 'utils/authRequests';
const vuetApiUrl = Constants.expoConfig?.extra?.vuetApiUrl;

const mutex = new Mutex();

const baseUrl = `http://${vuetApiUrl}`;

const baseQuery = fetchBaseQuery({
  baseUrl,
  prepareHeaders: (headers, { getState }) => {
    // By default, if we have a token in the store, let's use that for authenticated requests
    const token = (getState() as EntireState)?.authentication.jwtAccessToken;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    headers.set('Accept', 'application/json');

    // Something weird here - when we have form data we need to set
    // a boundary on the content-type header. This happens automatically
    // if we delete the content type here
    if (headers.get('Content-Type')?.includes('form-data')) {
      headers.delete('Content-Type');
    } else {
      headers.set(
        'Content-Type',
        headers.get('Content-Type') || 'application/json'
      );
    }
    return headers;
  }
});

const customFetchBase: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // wait until the mutex is available without locking it
  await mutex.waitForUnlock();
  let result = await baseQuery(args, api, extraOptions);
  if (
    ['token_not_valid', 'user_not_found'].includes(
      (result.error?.data as any)?.code
    )
  ) {
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      const jwtRefreshToken = (api.getState() as EntireState)?.authentication
        .jwtRefreshToken;
      try {
        if (jwtRefreshToken) {
          const verifyRefreshResponse = await verifyTokenAsync(jwtRefreshToken);
          if (verifyRefreshResponse.code) {
            api.dispatch(logOut());
          } else {
            const jwtRefreshResponse = await refreshTokenAsync(jwtRefreshToken);
            const refreshedAccessCode = jwtRefreshResponse.access;
            const refreshedRefreshCode = jwtRefreshResponse.refresh;

            api.dispatch(setAccessToken(refreshedAccessCode));
            api.dispatch(setRefreshToken(refreshedRefreshCode));
            result = await baseQuery(args, api, extraOptions);
          }
        }
      } finally {
        // release must be called once the mutex should be released again.
        release();
      }
    } else {
      // wait until the mutex is available without locking it
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  if (result.error) {
    console.log(result.error);
  }

  return result;
};

export default customFetchBase;
