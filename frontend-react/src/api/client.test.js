import { afterEach, describe, expect, it, vi } from 'vitest';
import apiClient, { apiErrorMessage } from './client';

describe('API client', () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('sends the bearer token only to the configured API origin', async () => {
    window.localStorage.setItem('token', 'private-access-token');
    const originalAdapter = apiClient.defaults.adapter;
    apiClient.defaults.adapter = async (config) => ({
      config,
      data: {},
      headers: {},
      status: 200,
      statusText: 'OK',
    });

    try {
      const apiResponse = await apiClient.get('/Auth/me');
      expect(apiResponse.config.headers.Authorization).toBe('Bearer private-access-token');

      const externalResponse = await apiClient.get('https://example.com/collect');
      expect(externalResponse.config.headers.Authorization).toBeUndefined();
    } finally {
      apiClient.defaults.adapter = originalAdapter;
    }
  });

  it.each([
    [403, 'You do not have permission to do that.'],
    [404, 'The requested item could not be found.'],
    [409, 'This change conflicts with an existing record.'],
    [429, 'Too many requests. Wait a moment, then try again.'],
    [503, 'This service is temporarily unavailable. Try again later.'],
    [500, 'The service encountered a problem. Try again later.'],
  ])('explains an HTTP %s failure', (status, message) => {
    expect(apiErrorMessage({ response: { status } })).toBe(message);
  });
});
