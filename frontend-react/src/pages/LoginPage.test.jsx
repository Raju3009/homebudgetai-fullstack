import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mocks = vi.hoisted(() => ({ login: vi.fn(), success: vi.fn(), error: vi.fn() }));

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ login: mocks.login }) }));
vi.mock('../context/ToastContext', () => ({ useToast: () => ({ success: mocks.success, error: mocks.error }) }));

import LoginPage from './LoginPage';

function renderLogin(entry = '/login') {
  return render(<MemoryRouter initialEntries={[entry]}><Routes><Route path="/login" element={<LoginPage />} /><Route path="/app/*" element={<div>Protected finance workspace</div>} /></Routes></MemoryRouter>);
}

describe('LoginPage', () => {
  afterEach(() => { cleanup(); vi.clearAllMocks(); });

  it('rejects an invalid email before calling the API', async () => {
    const user = userEvent.setup();
    renderLogin();
    await user.type(screen.getByLabelText('Email Address'), 'invalid-email');
    await user.type(screen.getByLabelText('Password'), 'password123');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(mocks.login).not.toHaveBeenCalled();
  });

  it('logs in and returns to the requested protected route', async () => {
    const user = userEvent.setup();
    mocks.login.mockResolvedValueOnce({ token: 'test-token' });
    renderLogin('/login?returnUrl=%2Fapp%2Ftransactions%3Fq%3Drent');
    await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'correct-horse');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith({ email: 'user@example.com', password: 'correct-horse' }));
    expect(await screen.findByText('Protected finance workspace')).toBeInTheDocument();
  });

  it('shows the API error response on invalid credentials', async () => {
    const user = userEvent.setup();
    mocks.login.mockRejectedValueOnce({ response: { status: 401, data: { message: 'Invalid credentials.' } } });
    renderLogin();
    await user.type(screen.getByLabelText('Email Address'), 'user@example.com');
    await user.type(screen.getByLabelText('Password'), 'wrong-password');
    await user.click(screen.getByRole('button', { name: 'Login' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid credentials.');
  });
});
