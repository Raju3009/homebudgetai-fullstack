import { useCallback, useEffect, useState } from 'react';
import { accountApi } from '../api/account';
import { authApi } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import PasswordChangeForm from '../components/PasswordChangeForm';
import PageHeader from '../components/PageHeader';
import { PageError, PageLoading } from '../components/PageState';
import { initials } from '../utils/format';
import { useToast } from '../context/ToastContext';

export default function ProfilePage() {
  const toast = useToast();
  const [profile, setProfile] = useState({ id: null, fullName: '', email: '', role: 'User', avatarUrl: '' });
  const [draft, setDraft] = useState({ fullName: '', avatarUrl: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.me();
      setProfile(data);
      setDraft({ fullName: data.fullName || '', avatarUrl: data.avatarUrl || '' });
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Profile details could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The effect starts an external data request; the loader owns its loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await accountApi.updateProfile({ fullName: draft.fullName.trim(), avatarUrl: draft.avatarUrl.trim() || null });
      setProfile(data);
      setDraft({ fullName: data.fullName || '', avatarUrl: data.avatarUrl || '' });
      toast.success('Profile updated.');
    } catch (requestError) {
      const message = apiErrorMessage(requestError, 'Profile could not be saved.');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoading label="Loading your profile…" />;
  if (error && !profile.email) return <PageError message={error} onRetry={load} />;

  return (
    <section className="workspace premium-page profile-grid">
      <PageHeader eyebrow="Account" title="Profile" description="Manage the details associated with your account." />
      <form className="panel editor" onSubmit={save}>
        <div className="section-head"><div><h2>Personal details</h2><p>Update your name and profile image.</p></div>{draft.avatarUrl ? <img className="avatar profile-photo" src={draft.avatarUrl} alt="Profile avatar" onError={(event) => { event.currentTarget.hidden = true; }} /> : <div className="avatar">{initials(draft.fullName)}</div>}</div>
        <label>Full Name<input required maxLength={120} value={draft.fullName} onChange={(event) => setDraft((current) => ({ ...current, fullName: event.target.value }))} /></label>
        <label>Email<input type="email" value={profile.email} readOnly /></label>
        <label>Avatar URL<input maxLength={512} type="url" value={draft.avatarUrl} onChange={(event) => setDraft((current) => ({ ...current, avatarUrl: event.target.value }))} placeholder="https://…" /></label>
        {error && <div className="error-box" role="alert">{error}</div>}
        <button className="btn-primary" type="submit" disabled={saving || !draft.fullName.trim()}>{saving ? 'Saving…' : 'Save profile'}</button>
        <div className="profile-role"><span>Role</span><strong>{profile.role}</strong></div>
      </form>
      <PasswordChangeForm onSuccess={(message) => toast.success(message)} onError={(message) => toast.error(message)} />
      <section className="panel full account-summary"><div className="section-head"><div><h2>Account details</h2><p>Information returned by your HomeBudgetAI API.</p></div></div><div className="category-row"><span>Account ID</span><strong>{profile.id ?? '—'}</strong></div><div className="category-row"><span>Email</span><strong>{profile.email}</strong></div><div className="category-row"><span>Role</span><strong>{profile.role}</strong></div></section>
    </section>
  );
}
