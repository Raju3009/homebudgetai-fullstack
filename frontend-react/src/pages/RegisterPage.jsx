import { useMemo, useState } from 'react';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { accountApi } from '../api/account';
import { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const currencies = [
  ['INR', 'INR - Indian Rupee'], ['USD', 'USD - US Dollar'], ['EUR', 'EUR - Euro'], ['GBP', 'GBP - British Pound'],
];

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', workspaceName: '', email: '', password: '', confirmPassword: '', currency: 'INR', notifications: true });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const strength = useMemo(() => [form.password.length >= 8, /[A-Z]/.test(form.password), /[a-z]/.test(form.password), /\d/.test(form.password), /[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length, [form.password]);
  const update = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.type === 'checkbox' ? event.target.checked : event.target.value }));

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setError('Enter a valid email address.'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    setLoading(true);
    try {
      await register({ fullName: form.fullName.trim(), email: form.email.trim(), password: form.password });
      window.localStorage.setItem('homebudgetai.workspace', form.workspaceName.trim());
      window.localStorage.setItem('homebudgetai.currency', form.currency);
      try {
        await accountApi.updateSettings({
          currency: form.currency,
          language: 'en',
          theme: 'system',
          emailNotifications: form.notifications,
          pushNotifications: form.notifications,
          monthlyDigest: form.notifications,
        });
      } catch {
        toast.warning('Your account was created, but preferences could not be saved. You can update them in Settings.');
      }
      toast.success('Workspace created. Your dashboard is ready.');
      navigate('/app/dashboard', { replace: true });
    } catch (requestError) {
      const message = apiErrorMessage(requestError, 'Registration failed. Please try again.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page premium-page register-premium">
      <div className="auth-visual register-visual"><div className="register-grid-bg" /><div className="auth-copy">
        <span className="badge success">Launch your finance workspace</span><h1>Create a smarter budgeting workspace.</h1>
        <p>Set up your account and choose your preferred currency for financial summaries.</p>
        <div className="feature-pills"><span>Form validation</span><span>Account-scoped data</span><span><ShieldCheck size={15} /> Secure API</span></div>
      </div></div>

      <div className="auth-card-wrap">
        <form className="auth-card register-card" onSubmit={submit} noValidate>
          <div className="auth-header"><span className="badge">Create account</span><h2>Create Workspace</h2><p>Register with your name, email, and a password of at least 8 characters.</p></div>
          <div className="form-row">
            <label>Full Name<input name="fullName" required autoComplete="name" value={form.fullName} onChange={update} placeholder="Your name" /></label>
            <label>Workspace Name<input name="workspaceName" required value={form.workspaceName} onChange={update} placeholder="Home workspace" /></label>
          </div>
          <label>Email Address<input name="email" type="email" required autoComplete="email" value={form.email} onChange={update} placeholder="you@example.com" /></label>
          <label>Password<div className="password-box"><input name="password" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={form.password} onChange={update} placeholder="Create a password" /><button className="btn-secondary" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          <div className={`strength-wrap ${strength <= 2 ? 'weak' : strength <= 4 ? 'medium' : 'strong'}`}>
            <div className="strength-bar"><span style={{ width: `${Math.max(8, strength * 20)}%` }} /></div><small>Password strength: <strong>{strength <= 2 ? 'Weak' : strength <= 4 ? 'Medium' : 'Strong'}</strong></small>
            <ul><li className={form.password.length >= 8 ? 'done' : ''}>8+ characters</li><li className={/[A-Z]/.test(form.password) ? 'done' : ''}>Uppercase</li><li className={/[a-z]/.test(form.password) ? 'done' : ''}>Lowercase</li><li className={/\d/.test(form.password) ? 'done' : ''}>Number</li><li className={/[^A-Za-z0-9]/.test(form.password) ? 'done' : ''}>Special character</li></ul>
          </div>
          <label>Confirm Password<div className="password-box"><input name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required autoComplete="new-password" value={form.confirmPassword} onChange={update} placeholder="Confirm password" /><button className="btn-secondary" type="button" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirmation' : 'Show confirmation'}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
          <div className="form-row"><label>Currency<select name="currency" value={form.currency} onChange={update}>{currencies.map(([code, label]) => <option value={code} key={code}>{label}</option>)}</select></label><label className="inline-check"><input name="notifications" type="checkbox" checked={form.notifications} onChange={update} /><span>Enable email and push preferences</span></label></div>
          {error && <div className="error-box" role="alert">{error}</div>}
          <button type="submit" className="btn-primary register-btn" disabled={loading || !form.fullName.trim() || !form.workspaceName.trim() || !form.email.trim() || form.password.length < 8 || form.password !== form.confirmPassword}>{loading ? 'Creating Workspace…' : 'Create Workspace'}</button>
          <div className="auth-link-row footer-row"><span>Already have an account?</span><Link to="/login">Login</Link></div>
        </form>
      </div>
    </section>
  );
}
