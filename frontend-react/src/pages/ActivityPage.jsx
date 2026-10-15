import { useCallback, useEffect, useMemo, useState } from 'react';
import { accountApi } from '../api/account';
import { apiErrorMessage } from '../api/client';
import { EmptyState, PageError, PageLoading } from '../components/PageState';
import { formatDate } from '../utils/format';
import { useToast } from '../context/ToastContext';

function activityGroup(value) {
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const week = new Date(today);
  week.setDate(today.getDate() - 7);
  if (date >= today) return 'Today';
  if (date >= yesterday) return 'Yesterday';
  if (date >= week) return 'This Week';
  return 'Earlier';
}

function eventLabel(item) {
  const text = `${item.title} ${item.message}`.toLowerCase();
  if (text.includes('expense')) return ['Expense update', 'Expense', '−'];
  if (text.includes('income')) return ['Income update', 'Income', '+'];
  if (text.includes('budget')) return ['Budget update', 'Budget', 'B'];
  if (text.includes('goal')) return ['Savings goal', 'Goal', 'G'];
  if (text.includes('insight') || text.includes('ai')) return ['Financial insight', 'Insight', 'AI'];
  if (text.includes('report')) return ['Report update', 'Report', 'R'];
  return ['Workspace activity', item.type || 'General', 'HB'];
}

export default function ActivityPage() {
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (showToast = false) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await accountApi.notifications();
      setItems(data || []);
      if (showToast) toast.info('Activity refreshed.');
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Activity could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // The effect starts an external data request; the loader owns its loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const groups = useMemo(() => {
    const labels = ['Today', 'Yesterday', 'This Week', 'Earlier'];
    return labels.map((label) => ({ label, items: items.filter((item) => activityGroup(item.createdAt) === label) })).filter((group) => group.items.length);
  }, [items]);
  const unread = items.filter((item) => !item.isRead).length;
  const thisWeek = items.filter((item) => ['Today', 'Yesterday', 'This Week'].includes(activityGroup(item.createdAt))).length;

  async function markRead(item) {
    try {
      await accountApi.markNotificationRead(item.id);
      setItems((current) => current.map((value) => value.id === item.id ? { ...value, isRead: true } : value));
      toast.success('Activity marked as read.');
    } catch (requestError) {
      toast.error(apiErrorMessage(requestError, 'Could not update activity status.'));
    }
  }

  if (loading && items.length === 0) return <PageLoading label="Loading account activity…" />;
  if (error && items.length === 0) return <PageError message={error} onRetry={() => load()} />;

  return (
    <section className="premium-page activity-page page-grid">
      <article className="metric"><span>Unread alerts</span><strong>{unread}</strong><small className="badge success">Needs review</small></article>
      <article className="metric"><span>Activity events</span><strong>{items.length}</strong><small>Latest notifications from your account</small></article>
      <article className="metric"><span>This week</span><strong>{thisWeek}</strong><small>Recent workspace activity</small></article>
      <section className="panel full activity-panel"><div className="section-head"><div><h2>Activity timeline</h2><p>Grouped by Today, Yesterday, and This Week.</p></div><button className="btn-secondary" type="button" onClick={() => load(true)} disabled={loading}>Refresh</button></div>
        {error && <div className="inline-error" role="alert">{error}</div>}
        {!loading && items.length === 0 && <EmptyState>No activity yet. Add transactions, budgets, or goals to build your timeline.</EmptyState>}
        <div className="activity-groups">{groups.map((group) => <section className="activity-group" key={group.label}><h3>{group.label}</h3>{group.items.map((item) => { const [action, category, icon] = eventLabel(item); return <article className={`activity-card${item.isRead ? '' : ' unread'}`} key={item.id}><div className="activity-icon">{icon}</div><div className="activity-main"><div className="activity-title"><strong>{action}</strong><span>{category}</span></div><p>{item.message}</p><small>{formatDate(item.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</small></div><button className="btn-secondary" type="button" disabled={item.isRead} onClick={() => markRead(item)}>{item.isRead ? 'Read' : 'Mark read'}</button></article>; })}</section>)}</div>
      </section>
    </section>
  );
}
