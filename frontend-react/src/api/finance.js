import apiClient from './client';

export const financeApi = {
  dashboard: (config) => apiClient.get('/Dashboard', config),
  budgets: (config) => apiClient.get('/Budgets', config),
  createBudget: (budget, config) => apiClient.post('/Budgets', budget, config),
  updateBudget: (id, budget, config) => apiClient.put(`/Budgets/${id}`, budget, config),
  deleteBudget: (id, config) => apiClient.delete(`/Budgets/${id}`, config),
  goals: (config) => apiClient.get('/Goals', config),
  createGoal: (goal, config) => apiClient.post('/Goals', goal, config),
  updateGoal: (id, goal, config) => apiClient.put(`/Goals/${id}`, goal, config),
  report: (params, config) => apiClient.get('/Reports/summary', { ...config, params }),
  exportReport: (params, config) => apiClient.get('/Reports/export', { ...config, params, responseType: 'blob' }),
};
