import apiClient from './client';

export const transactionsApi = {
  list: (params, config) => apiClient.get('/Transactions', { ...config, params }),
  create: (transaction, config) => apiClient.post('/Transactions', transaction, config),
  update: (id, transaction, config) => apiClient.put(`/Transactions/${id}`, transaction, config),
  remove: (id, config) => apiClient.delete(`/Transactions/${id}`, config),
  exportCsv: (params, config) => apiClient.get('/Transactions/export', { ...config, params, responseType: 'blob' }),
};
