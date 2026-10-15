import axios from 'axios';

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const apiBaseUrl = (configuredBaseUrl || 'http://localhost:5033/api').replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 20_000,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.request.use((config) => {
  const token = window.localStorage.getItem('token');
  if (token) {
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
  if (error?.code === 'ECONNABORTED') return 'The API request timed out. Try again.';
  if (error?.request && !error?.response) return 'The API could not be reached. Check the API URL and connection.';
  return fallback;
}

export default apiClient;
