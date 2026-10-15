import axios from 'axios';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
const resolvedBaseUrl = configuredBaseUrl || (import.meta.env.DEV ? 'http://localhost:5033/api' : undefined);

if (!resolvedBaseUrl) {
  throw new Error('VITE_API_BASE_URL must be set to the production API URL before building the React app.');
}

export const apiBaseUrl = resolvedBaseUrl.replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('token');
  const apiOrigin = new URL(apiBaseUrl, window.location.origin).origin;
  const requestBase = config.baseURL || apiBaseUrl;
  let requestOrigin;
  try {
    requestOrigin = new URL(config.url || '', new URL(requestBase, window.location.origin)).origin;
  } catch {
    requestOrigin = null;
  }
  if (token && requestOrigin === apiOrigin) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url?.toLowerCase() ?? '';
    if (error.response?.status === 401 && !requestUrl.includes('/auth/login') && !requestUrl.includes('/auth/register')) {
      window.localStorage.removeItem('token');
      window.localStorage.removeItem('tokenExpiresAt');
      window.localStorage.removeItem('refreshToken');
      window.localStorage.removeItem('user');
      window.dispatchEvent(new CustomEvent('homebudget:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export function apiErrorMessage(error, fallback = 'The request could not be completed.') {
  if (error?.response?.data && typeof error.response.data === 'object') {
    const body = error.response.data;
    if (typeof body.message === 'string') return body.message;
    if (typeof body.title === 'string') return body.title;
    if (body.errors && typeof body.errors === 'object') {
      const firstError = Object.values(body.errors).flat().find((value) => typeof value === 'string');
      if (firstError) return firstError;
    }
  }
  const status = error?.response?.status;
  if (status === 401) return 'Your session has expired. Log in again.';
  if (status === 403) return 'You do not have permission to do that.';
  if (status === 404) return 'The requested item could not be found.';
  if (status === 409) return 'This change conflicts with an existing record.';
  if (status === 429) return 'Too many requests. Wait a moment, then try again.';
  if (status === 503) return 'This service is temporarily unavailable. Try again later.';
  if (status >= 500) return 'The service encountered a problem. Try again later.';
  if (status === 400) return 'Check the information and try again.';
  if (error?.code === 'ECONNABORTED') return 'The API request timed out. Try again.';
  if (error?.request && !error?.response) return 'The API could not be reached. Check the API URL and connection.';
  return fallback;
}

export default apiClient;
