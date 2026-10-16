import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  register: vi.fn(),
  updateSettings: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
  error: vi.fn(),
}));

vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ register: mocks.register }) }));
vi.mock('../context/ToastContext', () => ({ useToast: () => ({ success: mocks.success, warning: mocks.warning, error: mocks.error }) }));
vi.mock('../api/account', () => ({ accountApi: { updateSettings: mocks.updateSettings } }));

import RegisterPage from './RegisterPage';

function renderRegister() {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/app/dashboard" element={<div>Dashboard ready</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function fillForm(user, email = 'new-user@example.com') {
  await user.type(screen.getByLabelText('Full Name'), 'Test User');
  await user.type(screen.getByLabelText('Workspace Name'), 'Home workspace');
  await user.type(screen.getByLabelText('Email Address'), email);
  await user.type(screen.getByLabelText('Password'), 'StrongPassword1!');
  await user.type(screen.getByLabelText('Confirm Password'), 'StrongPassword1!');
}

describe('RegisterPage', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.clearAllMocks();
  });

  it('rejects an invalid email before calling the API', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillForm(user, 'invalid-email');
    await user.click(screen.getByRole('button', { name: 'Create Workspace' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(mocks.register).not.toHaveBeenCalled();
  });

  it('registers, saves supported preferences, and opens the dashboard', async () => {
    const user = userEvent.setup();
    mocks.register.mockResolvedValueOnce({ token: 'test-token' });
    mocks.updateSettings.mockResolvedValueOnce({ data: { currency: 'INR' } });
    renderRegister();
    await fillForm(user);
    await user.click(screen.getByRole('button', { name: 'Create Workspace' }));

    await waitFor(() => expect(mocks.register).toHaveBeenCalledWith({
      fullName: 'Test User',
      email: 'new-user@example.com',
      password: 'StrongPassword1!',
    }));
    expect(mocks.updateSettings).toHaveBeenCalledWith({
      currency: 'INR',
      language: 'en',
      theme: 'system',
      emailNotifications: true,
      pushNotifications: true,
      monthlyDigest: true,
    });
    expect(window.localStorage.getItem('homebudgetai.workspace')).toBe('Home workspace');
    expect(await screen.findByText('Dashboard ready')).toBeInTheDocument();
  });
});
