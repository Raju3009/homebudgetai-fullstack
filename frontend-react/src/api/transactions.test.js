import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./client', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

import apiClient from './client';
import { transactionsApi } from './transactions';

describe('transactionsApi', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sends search filters to the real paged endpoint', async () => {
    const response = { data: { items: [], page: 2, pageSize: 10, totalItems: 0, totalPages: 0 } };
    apiClient.get.mockResolvedValueOnce(response);

    await expect(transactionsApi.list({ q: 'rent', type: 'Expense', page: 2, pageSize: 10 })).resolves.toBe(response);
    expect(apiClient.get).toHaveBeenCalledWith('/Transactions', { params: { q: 'rent', type: 'Expense', page: 2, pageSize: 10 } });
  });

  it('propagates a failed write instead of returning a local success object', async () => {
    const failure = new Error('API unavailable');
    apiClient.post.mockRejectedValueOnce(failure);

    await expect(transactionsApi.create({ title: 'Rent', amount: 10 })).rejects.toBe(failure);
  });

  it('requests a CSV attachment from the API', async () => {
    const response = { data: new Blob(['Date,Amount']) };
    apiClient.get.mockResolvedValueOnce(response);

    await expect(transactionsApi.exportCsv({ type: 'Expense' })).resolves.toBe(response);
    expect(apiClient.get).toHaveBeenCalledWith('/Transactions/export', { params: { type: 'Expense' }, responseType: 'blob' });
  });
});
