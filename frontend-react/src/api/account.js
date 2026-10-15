import apiClient from './client';

export const accountApi = {
  notifications: (config) => apiClient.get('/Notifications', config),
  markNotificationRead: (id, config) => apiClient.post(`/Notifications/${id}/read`, {}, config),
  settings: (config) => apiClient.get('/Settings', config),
  updateSettings: (settings, config) => apiClient.put('/Settings', settings, config),
  updateProfile: (profile, config) => apiClient.put('/Profile', profile, config),
  changePassword: (currentPassword, newPassword, config) => apiClient.post('/Profile/change-password', { currentPassword, newPassword }, config),
};
