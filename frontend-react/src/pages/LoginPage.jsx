import { useState } from 'react';
import { ArrowRight, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { apiErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function requestedDestination(location, searchParams) {
  const requested = location.state?.returnUrl || searchParams.get('returnUrl');
  return requested?.startsWith('/app/') ? requested : '/app/dashboard';
}

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.has('expired') ? 'Your session expired. Please log in again.' : '');

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.');
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      toast.success('Welcome back. Your dashboard is ready.');
      navigate(requestedDestination(location, searchParams), { replace: true });
    } catch (requestError) {
      const message = apiErrorMessage(requestError, 'Login failed. Check your credentials and try again.');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page premium-page login-premium">
      <div className="auth-visual login-visual">
        <div className="login-video-shade" />
        <div className="auth-copy login-copy">
          <span className="badge success"><Sparkles size={15} /> HomeBudgetAI</span>
          <h1>Take control of your finances.</h1>
          <p>See cash flow, budgets, and savings signals in one calm workspace, connected to your account data.</p>
          <div className="feature-pills"><span><ShieldCheck size={15} /> Protected routes</span><span><LockKeyhole size={15} /> Secure API access</span></div>
        </div>
      </div>

      <div className="auth-card-wrap login-card-wrap">
        <form className="auth-card login-card" onSubmit={submit} noValidate>
          <div className="auth-header"><span className="badge">Welcome back</span><h2>Sign in</h2><p>Use the email and password for your HomeBudgetAI account.</p></div>
          {error && <div className="error-box" role="alert">{error}</div>}
          <label>Email Address<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
          <label>Password
            <div className="password-box"><input type={showPassword ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" /><button className="btn-secondary" type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
          </label>
          <div className="auth-link-row"><Link to="/forgot-password">Forgot password?</Link></div>
          <button className="btn-primary login-btn" type="submit" disabled={loading || !email.trim() || !password}>{loading ? 'Signing in…' : <>Login <ArrowRight size={16} /></>}</button>
          <div className="auth-link-row footer-row"><span>New to HomeBudgetAI?</span><Link to="/register">Create an account</Link></div>
          <Link className="back-home-link" to="/">Back to HomeBudgetAI</Link>
        </form>
      </div>
    </section>
  );
}
