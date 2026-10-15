import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ResetPasswordPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();
  const [form, setForm] = useState({ email: location.state?.email || searchParams.get('email') || '', token: location.state?.token || searchParams.get('token') || '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  function update(event) { setForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function submit(event) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (form.newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.newPassword !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.resetPassword({ email: form.email.trim(), token: form.token.trim(), newPassword: form.newPassword });
      setMessage(data.message || 'Password reset successful.');
      toast.success('Password reset successful.');
      window.setTimeout(() => navigate('/login', { replace: true }), 900);
    } catch (requestError) {
      const text = apiErrorMessage(requestError, 'Password reset failed.');
      setError(text);
      toast.error(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page premium-page">
      <div className="auth-visual"><div className="auth-copy"><span className="badge success">Verified reset</span><h1>Choose a new password.</h1><p>Use the email and one-time token returned by your configured reset delivery.</p></div></div>
      <div className="auth-card-wrap"><form className="auth-card" onSubmit={submit}>
        <div className="auth-header"><span className="badge">Security checkpoint</span><h2>Reset Password</h2><p>Enter your email, reset token, and new password.</p></div>
        {error && <div className="error-box" role="alert">{error}</div>}{message && <div className="status-panel" role="status">{message}</div>}
        <label>Email<input name="email" type="email" required autoComplete="email" value={form.email} onChange={update} /></label>
        <label>Reset Token<input name="token" required autoComplete="one-time-code" value={form.token} onChange={update} /></label>
        <label>New Password<div className="password-box"><input name="newPassword" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={form.newPassword} onChange={update} /><button type="button" className="btn-secondary" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide passwords' : 'Show passwords'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
        <label>Confirm Password<input name="confirmPassword" type={showPassword ? 'text' : 'password'} required autoComplete="new-password" value={form.confirmPassword} onChange={update} /></label>
        <button className="btn-primary" type="submit" disabled={loading || !form.email.trim() || !form.token.trim() || !form.newPassword || !form.confirmPassword}>{loading ? 'Resetting…' : 'Reset Password'}</button>
        <Link to="/login">Back to login</Link>
      </form></div>
    </section>
  );
}
