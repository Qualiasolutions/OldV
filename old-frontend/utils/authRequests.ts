import Constants from 'expo-constants';

const vuetApiUrl = Constants.expoConfig?.extra?.vuetApiUrl;

type LoginResponse = {
  access: string;
  refresh: string;
};

type VerifyResponse = {
  detail?: string;
  code?: string;
};

type RefreshResponse = {
  access: string;
  refresh: string;
};

type BlacklistResponse = { success: boolean };

const getTokenAsync = async (
  username: string,
  password: string,
  isEmail: boolean
) => {
  const usernameField = isEmail ? 'email' : 'phone_number';
  const loginResponse: LoginResponse = await fetch(
    `http://${vuetApiUrl}/auth/token/`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        [usernameField]: username,
        password
      })
    }
  )
    .then((response) => {
      const resJson = response.json();
      return resJson;
    })
    .catch((err) => {
      console.log(err);
    });

  return loginResponse;
};

const verifyTokenAsync = async (token: string): Promise<VerifyResponse> => {
  const verifyResponse: VerifyResponse = await fetch(
    `http://${vuetApiUrl}/auth/token/verify/`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ token })
    }
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw Error('Failed to verify token');
      }
    })
    .catch((err) => {
      return {
        detail: 'Failed to verify token',
        code: 'failed_to_verify_token'
      };
    });

  return verifyResponse;
};

const refreshTokenAsync = async (refreshToken: string) => {
  const refreshResponse: RefreshResponse = await fetch(
    `http://${vuetApiUrl}/auth/token/refresh/`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh: refreshToken })
    }
  )
    .then((response) => {
      if (response.ok) {
        return response.json();
      } else {
        throw Error('Failed to refresh token');
      }
    })
    .catch((err) => {
      return {
        detail: 'Failed to refresh token',
        code: 'failed_to_refresh_token'
      };
    });

  return refreshResponse;
};

const blacklistTokenAsync = async (refreshToken: string) => {
  const refreshResponse: BlacklistResponse = await fetch(
    `http://${vuetApiUrl}/auth/token/blacklist/`,
    {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refresh: refreshToken })
    }
  )
    .then((response) => response.json())
    .catch((err) => {
      console.log(err);
    });

  return refreshResponse;
};

export {
  getTokenAsync,
  verifyTokenAsync,
  refreshTokenAsync,
  blacklistTokenAsync
};
