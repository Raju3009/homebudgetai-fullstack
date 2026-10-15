import { useState } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [resetSession, setResetSession] = useState(null);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setResetSession(null);
    try {
      const { data } = await authApi.forgotPassword(email.trim());
      setMessage(data.message || 'If this email exists, reset instructions will be sent.');
      if (data.resetToken) setResetSession({ email: email.trim(), token: data.resetToken });
      toast.info('Password recovery request processed.');
    } catch (error) {
      const text = apiErrorMessage(error, 'Unable to request a password reset. Try again.');
      setMessage(text);
      toast.error(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page premium-page forgot-page">
      <div className="auth-visual forgot-visual"><div className="auth-copy"><span className="badge success">Secure recovery</span><h1>Reset access and get back to your workspace.</h1><p>Enter the email for your account. Reset delivery depends on the API configuration.</p><div className="recovery-steps"><span>1. Request a reset</span><span>2. Enter your reset token</span><span>3. Choose a new password</span></div></div></div>
      <div className="auth-card-wrap"><form className="auth-card forgot-card" onSubmit={submit}>
        <div className="auth-header"><span className="badge"><LockKeyhole size={14} /> Password recovery</span><h2>Forgot Password</h2><p>We will show the API response for your account.</p></div>
        {message && <div className="status-panel" role="status">{message}</div>}
        <label>Email Address<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <button className="btn-primary recover-btn" type="submit" disabled={loading || !email.trim()}>{loading ? 'Sending…' : 'Send reset instructions'}</button>
        {resetSession && <button className="btn-secondary reset-continue" type="button" onClick={() => navigate('/reset-password', { state: resetSession })}>Continue to Reset Password <ArrowRight size={16} /></button>}
        <Link to="/login">Back to Login</Link>
      </form></div>
    </section>
  );
}
