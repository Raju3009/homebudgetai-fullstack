import { useCallback, useEffect, useState } from 'react';
import { accountApi } from '../api/account';
import { authApi } from '../api/auth';
import { apiErrorMessage } from '../api/client';
import PasswordChangeForm from '../components/PasswordChangeForm';
import PageHeader from '../components/PageHeader';
import { PageError, PageLoading } from '../components/PageState';
import { useToast } from '../context/ToastContext';

const defaultSettings = { theme: 'system', currency: 'USD', language: 'en', emailNotifications: true, pushNotifications: true, monthlyDigest: true };

function applyTheme(theme) {
  const dark = theme === 'dark' || (theme === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  window.localStorage.setItem('homebudgetai.theme', dark ? 'dark' : 'light');
  window.dispatchEvent(new CustomEvent('homebudgetai-theme', { detail: { dark } }));
}

export default function SettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState(defaultSettings);
  const [profile, setProfile] = useState({ fullName: '', email: '', avatarUrl: '' });
  const [workspace, setWorkspace] = useState(() => ({ name: window.localStorage.getItem('homebudgetai.workspace') || 'HomeBudgetAI Workspace', type: window.localStorage.getItem('homebudgetai.workspaceType') || 'Personal Finance' }));
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [settingsResult, profileResult] = await Promise.all([accountApi.settings(), authApi.me()]);
      setSettings(settingsResult.data);
      setProfile({ fullName: profileResult.data.fullName || '', email: profileResult.data.email || '', avatarUrl: profileResult.data.avatarUrl || '' });
      window.localStorage.setItem('homebudgetai.currency', settingsResult.data.currency || 'USD');
      applyTheme(settingsResult.data.theme || 'system');
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Settings could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The effect starts an external data request; the loader owns its loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  function updateSettings(event) {
    const { name, value, checked, type } = event.target;
    setSettings((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  }

  async function savePreferences(event) {
    event.preventDefault();
    setSavingSettings(true);
    setError('');
    try {
      const { data } = await accountApi.updateSettings(settings);
      setSettings(data);
      window.localStorage.setItem('homebudgetai.currency', data.currency || 'USD');
      applyTheme(data.theme || 'system');
      toast.success('Preferences saved.');
    } catch (requestError) {
      const message = apiErrorMessage(requestError, 'Settings could not be saved.');
      setError(message);
      toast.error(message);
    } finally {
      setSavingSettings(false);
    }
  }

  async function saveProfile(event) {
    event.preventDefault();
    setSavingProfile(true);
    setError('');
    try {
      const { data } = await accountApi.updateProfile({ fullName: profile.fullName.trim(), avatarUrl: profile.avatarUrl.trim() || null });
      setProfile({ fullName: data.fullName, email: data.email, avatarUrl: data.avatarUrl || '' });
      toast.success('Profile saved.');
    } catch (requestError) {
      const message = apiErrorMessage(requestError, 'Profile could not be saved.');
      setError(message);
      toast.error(message);
    } finally {
      setSavingProfile(false);
    }
  }

  function saveWorkspace(event) {
    event.preventDefault();
    window.localStorage.setItem('homebudgetai.workspace', workspace.name.trim());
    window.localStorage.setItem('homebudgetai.workspaceType', workspace.type);
    toast.success('Workspace preferences saved in this browser.');
  }

  if (loading) return <PageLoading label="Loading account settings…" />;
  if (error && !profile.email) return <PageError message={error} onRetry={load} />;

  return (
    <section className="premium-page settings-page"><PageHeader eyebrow="Account" title="Settings" description="Manage your display preferences, notifications, and workspace details." />

      {error && <div className="panel full inline-error" role="alert">{error}</div>}
      <div className="settings-layout">
        <form className="panel settings-section" onSubmit={saveProfile}><div className="section-head"><div><h2>Profile</h2><p>Name, email, and avatar.</p></div><span className="avatar-preview">{profile.fullName.slice(0, 2).toUpperCase() || 'HB'}</span></div><div className="form-grid"><label>Name<input required maxLength={120} value={profile.fullName} onChange={(event) => setProfile((current) => ({ ...current, fullName: event.target.value }))} /></label><label>Email<input type="email" value={profile.email} readOnly /></label><label>Avatar URL<input type="url" maxLength={512} value={profile.avatarUrl} onChange={(event) => setProfile((current) => ({ ...current, avatarUrl: event.target.value }))} /></label></div><div className="settings-actions"><button className="btn-primary" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save profile'}</button></div></form>

        <form className="panel settings-section" onSubmit={savePreferences}><div className="section-head"><div><h2>Preferences</h2><p>Currency, theme, language, and notifications.</p></div></div><div className="form-grid"><label>Theme<select name="theme" value={settings.theme} onChange={updateSettings}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label><label>Currency<select name="currency" value={settings.currency} onChange={updateSettings}><option value="INR">INR - Indian Rupee</option><option value="USD">USD - US Dollar</option><option value="EUR">EUR - Euro</option><option value="GBP">GBP - British Pound</option></select></label><label>Language<select name="language" value={settings.language} onChange={updateSettings}><option value="en">English</option><option value="hi">Hindi</option><option value="es">Spanish</option><option value="fr">French</option></select></label></div><div className="toggle-list"><label className="toggle-row"><span><strong>Email notifications</strong><small>Preference saved by the API.</small></span><input name="emailNotifications" type="checkbox" checked={settings.emailNotifications} onChange={updateSettings} /></label><label className="toggle-row"><span><strong>Push notifications</strong><small>Preference saved by the API.</small></span><input name="pushNotifications" type="checkbox" checked={settings.pushNotifications} onChange={updateSettings} /></label><label className="toggle-row"><span><strong>Monthly digest</strong><small>Preference saved by the API.</small></span><input name="monthlyDigest" type="checkbox" checked={settings.monthlyDigest} onChange={updateSettings} /></label></div><div className="settings-actions"><button className="btn-primary" type="submit" disabled={savingSettings}>{savingSettings ? 'Saving…' : 'Save preferences'}</button></div></form>

        <PasswordChangeForm compact onSuccess={(message) => toast.success(message)} onError={(message) => toast.error(message)} />

        <form className="panel settings-section workspace-card" onSubmit={saveWorkspace}><div className="section-head"><div><h2>Workspace</h2><p>These display preferences are stored in this browser.</p></div></div><div className="form-grid"><label>Workspace Name<input required maxLength={120} value={workspace.name} onChange={(event) => setWorkspace((current) => ({ ...current, name: event.target.value }))} /></label><label>Workspace Type<select value={workspace.type} onChange={(event) => setWorkspace((current) => ({ ...current, type: event.target.value }))}><option>Personal Finance</option><option>Family Budget</option><option>Freelance Finance</option><option>Student Budget</option></select></label></div><div className="settings-actions"><button className="btn-primary" type="submit">Save workspace</button></div></form>
      </div>
    </section>
  );
}
