import apiClient from './client';

export const authApi = {
  login: (credentials, config) => apiClient.post('/Auth/login', credentials, config),
  register: (details, config) => apiClient.post('/Auth/register', details, config),
  refresh: (refreshToken, config) => apiClient.post('/Auth/refresh', { refreshToken }, config),
  forgotPassword: (email, config) => apiClient.post('/Auth/forgot-password', { email }, config),
  resetPassword: (details, config) => apiClient.post('/Auth/reset-password', details, config),
  me: (config) => apiClient.get('/Auth/me', config),
};
