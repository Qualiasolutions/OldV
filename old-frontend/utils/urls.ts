import Constants from 'expo-constants';
const vuetApiUrl = Constants.expoConfig?.extra?.vuetApiUrl;

export const makeApiUrl = (path: string): string => {
  const apiUrl = `http://${vuetApiUrl}${path}`;
  const trailingSlash = apiUrl.slice(-1) === '/' ? '' : '/';
  return `http://${vuetApiUrl}${path}${trailingSlash}`;
};

// Hacky string replacement for local dev (ensure can access localstack S3)
export const parsePresignedUrl = (url: string) => {
  return url?.replace('localstack', vuetApiUrl.split(':')[0]);
};
