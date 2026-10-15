import { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, Bell, CircleCheck, FileText, Flag, RefreshCw, Sparkles } from 'lucide-react';
import { accountApi } from '../api/account';
import { apiErrorMessage } from '../api/client';
import { EmptyState, PageError, PageLoading } from '../components/PageState';
import PageHeader from '../components/PageHeader';
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
  if (date >= week) return 'This week';
  return 'Earlier';
}

function eventLabel(item) {
  const text = (item.title + ' ' + item.message).toLowerCase();
  if (text.includes('expense')) return ['Expense update', 'Expense', ArrowUpRight];
  if (text.includes('income')) return ['Income update', 'Income', ArrowDownRight];
  if (text.includes('budget')) return ['Budget update', 'Budget', Flag];
  if (text.includes('goal')) return ['Savings goal', 'Goal', CircleCheck];
  if (text.includes('insight') || text.includes('ai')) return ['Financial insight', 'Insight', Sparkles];
  if (text.includes('report')) return ['Report update', 'Report', FileText];
  return ['Workspace activity', item.type || 'General', Activity];
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
    const labels = ['Today', 'Yesterday', 'This week', 'Earlier'];
    return labels.map((label) => ({ label, items: items.filter((item) => activityGroup(item.createdAt) === label) })).filter((group) => group.items.length);
  }, [items]);
  const unread = items.filter((item) => !item.isRead).length;
  const thisWeek = items.filter((item) => ['Today', 'Yesterday', 'This week'].includes(activityGroup(item.createdAt))).length;

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
    <section className="premium-page activity-page">
      <PageHeader eyebrow="Insights" title="Activity" description="A clear timeline of updates from your account." actions={<button className="btn-secondary" type="button" onClick={() => load(true)} disabled={loading}><RefreshCw size={16} /> Refresh</button>} />
      <section className="activity-summary-grid" aria-label="Activity summary">
        <article className="summary-tile"><span className="summary-tile-icon"><Bell size={18} /></span><span><strong>{unread}</strong><small>Unread alerts</small></span></article>
        <article className="summary-tile"><span className="summary-tile-icon"><Activity size={18} /></span><span><strong>{items.length}</strong><small>Account events</small></span></article>
        <article className="summary-tile"><span className="summary-tile-icon"><RefreshCw size={18} /></span><span><strong>{thisWeek}</strong><small>In the last 7 days</small></span></article>
      </section>
      <section className="panel activity-panel">
        <div className="section-head"><div><h2>Recent updates</h2><p>Notifications grouped by when they happened.</p></div><span className="badge">{unread} unread</span></div>
        {error && <div className="inline-error" role="alert">{error}</div>}
        {!loading && items.length === 0 && <EmptyState>No activity yet. Updates will appear here as you use the workspace.</EmptyState>}
        <div className="activity-groups">{groups.map((group) => (
          <section className="activity-group" key={group.label}>
            <h3>{group.label}</h3>
            {group.items.map((item) => {
              const [action, category, Icon] = eventLabel(item);
              return <article className={'activity-card' + (item.isRead ? '' : ' unread')} key={item.id}>
                <div className="activity-icon"><Icon size={18} /></div>
                <div className="activity-main"><div className="activity-title"><strong>{action}</strong><span>{category}</span></div><p>{item.message}</p><small>{formatDate(item.createdAt, { dateStyle: 'medium', timeStyle: 'short' })}</small></div>
                <button className="btn-secondary activity-read-action" type="button" disabled={item.isRead} onClick={() => markRead(item)}>{item.isRead ? <><CircleCheck size={15} /> Read</> : 'Mark as read'}</button>
              </article>;
            })}
          </section>
        ))}</div>
      </section>
    </section>
  );
}
