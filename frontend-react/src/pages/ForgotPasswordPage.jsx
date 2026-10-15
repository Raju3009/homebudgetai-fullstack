import { useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [hasError, setHasError] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage('');
    setHasError(false);
    try {
      const { data } = await authApi.forgotPassword(email.trim());
      setMessage(data.message || 'If this email exists, reset instructions will be sent.');
      toast.info('Password recovery request processed.');
    } catch (error) {
      const text = apiErrorMessage(error, 'Unable to request a password reset. Try again.');
      setMessage(text);
      setHasError(true);
      toast.error(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page premium-page forgot-page">
      <div className="auth-visual forgot-visual"><div className="auth-copy"><span className="badge success">Secure recovery</span><h1>Reset access and get back to your workspace.</h1><p>Password recovery requires an email delivery service. Contact support until recovery is configured.</p><div className="recovery-steps"><span>1. Contact support</span><span>2. Verify account ownership</span><span>3. Restore access securely</span></div></div></div>
      <div className="auth-card-wrap"><form className="auth-card forgot-card" onSubmit={submit}>
        <div className="auth-header"><span className="badge"><LockKeyhole size={14} /> Password recovery</span><h2>Forgot Password</h2><p>Reset email delivery is not configured yet. The form reports that clearly and does not expose account recovery tokens.</p></div>
        {message && <div className={hasError ? 'error-box' : 'status-panel'} role={hasError ? 'alert' : 'status'}>{message}</div>}
        <label>Email Address<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <button className="btn-primary recover-btn" type="submit" disabled={loading || !email.trim()}>{loading ? 'Sending…' : 'Send reset instructions'}</button>
        <Link to="/login">Back to Login</Link>
      </form></div>
    </section>
  );
}
