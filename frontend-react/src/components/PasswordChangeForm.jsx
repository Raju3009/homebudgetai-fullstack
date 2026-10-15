import { useState } from 'react';
import { accountApi } from '../api/account';
import { apiErrorMessage } from '../api/client';

export default function PasswordChangeForm({ onSuccess, onError, compact = false }) {
  const [values, setValues] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  function update(event) { setValues((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function submit(event) {
    event.preventDefault();
    setMessage('');
    if (values.newPassword.length < 8) { setMessage('New password must be at least 8 characters.'); return; }
    if (values.newPassword !== values.confirmPassword) { setMessage('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { data } = await accountApi.changePassword(values.currentPassword, values.newPassword);
      setValues({ currentPassword: '', newPassword: '', confirmPassword: '' });
      onSuccess?.(data.message || 'Password changed.');
    } catch (error) {
      const text = apiErrorMessage(error, 'Password could not be changed.');
      setMessage(text);
      onError?.(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className={`panel editor password-change-form${compact ? ' compact' : ''}`} onSubmit={submit}>
      <div className="section-head"><div><h2>Password</h2><p>Change your account password.</p></div></div>
      <label>Current Password<input name="currentPassword" type="password" required autoComplete="current-password" value={values.currentPassword} onChange={update} /></label>
      <label>New Password<input name="newPassword" type="password" required minLength={8} autoComplete="new-password" value={values.newPassword} onChange={update} /></label>
      <label>Confirm Password<input name="confirmPassword" type="password" required autoComplete="new-password" value={values.confirmPassword} onChange={update} /></label>
      {message && <div className="error-box" role="alert">{message}</div>}
      <button className="btn-primary" type="submit" disabled={loading || !values.currentPassword || !values.newPassword || !values.confirmPassword}>{loading ? 'Saving…' : 'Change password'}</button>
    </form>
  );
}
