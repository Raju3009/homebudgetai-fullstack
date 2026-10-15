import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const mocks = vi.hoisted(() => ({ login: vi.fn(), register: vi.fn(), me: vi.fn() }));

vi.mock('../api/auth', () => ({ authApi: mocks }));

import { AuthProvider, useAuth } from './AuthContext';

function AuthProbe() {
  const { user, loading, isAuthenticated, login, logout } = useAuth();
  return (
    <div>
      <output data-testid="auth-state">{loading ? 'loading' : isAuthenticated ? user.fullName : 'signed out'}</output>
      <button type="button" onClick={() => login({ email: 'user@example.com', password: 'password' })}>Sign in</button>
      <button type="button" onClick={logout}>Sign out</button>
    </div>
  );
}

describe('AuthProvider', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('stores the bearer session and clears it on logout', async () => {
    mocks.login.mockResolvedValueOnce({ data: {
      token: 'access-token',
      expiresAt: new Date(Date.now() + 1_500).toISOString(),
      id: 1,
      email: 'user@example.com',
      fullName: 'Budget User',
      role: 'User',
      refreshToken: 'unused-refresh-token',
    } });
    render(<AuthProvider><AuthProbe /></AuthProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByText('Budget User')).toBeInTheDocument();
    expect(window.localStorage.getItem('token')).toBe('access-token');
    expect(window.localStorage.getItem('refreshToken')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('signed out'));
    expect(window.localStorage.getItem('token')).toBeNull();
  });

  it('clears a session immediately when the API token is already expired', async () => {
    mocks.login.mockResolvedValueOnce({ data: {
      token: 'expired-token',
      expiresAt: new Date(Date.now() - 1_000).toISOString(),
      id: 2,
      email: 'expired@example.com',
      fullName: 'Expired User',
      role: 'User',
    } });
    render(<AuthProvider><AuthProbe /></AuthProvider>);

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(window.localStorage.getItem('token')).toBe('expired-token'));
    await waitFor(() => expect(screen.getByTestId('auth-state')).toHaveTextContent('signed out'));
    await waitFor(() => expect(window.localStorage.getItem('token')).toBeNull());
    expect(window.localStorage.getItem('token')).toBeNull();
    expect(window.localStorage.getItem('tokenExpiresAt')).toBeNull();
  });
});
