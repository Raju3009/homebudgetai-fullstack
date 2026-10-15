import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, CircleAlert, CircleCheck, Flag, Plus, Target } from 'lucide-react';
import { financeApi } from '../api/finance';
import { apiErrorMessage } from '../api/client';
import { EmptyState, PageError, PageLoading } from '../components/PageState';
import PageHeader from '../components/PageHeader';
import { formatCurrency, formatDate, dateInputValue, dateOnlyToUtc } from '../utils/format';
import { useToast } from '../context/ToastContext';

const localMonth = () => {
  const now = new Date();
  return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
};
const emptyBudget = () => ({ name: '', category: 'Food', limitAmount: '1000', alertThreshold: '80', month: localMonth() });
const emptyGoal = () => ({ name: '', targetAmount: '', currentAmount: '0', dueDate: '', color: '#18845f' });
const percentUsed = (budget) => Number(budget.limitAmount) > 0 ? Number(budget.spentAmount) / Number(budget.limitAmount) * 100 : 0;

export default function BudgetsPage() {
  const toast = useToast();
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('highest');
  const [budgetForm, setBudgetForm] = useState(emptyBudget);
  const [goalForm, setGoalForm] = useState(emptyGoal);
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [budgetResult, goalResult] = await Promise.all([financeApi.budgets(), financeApi.goals()]);
      setBudgets(budgetResult.data || []);
      setGoals(goalResult.data || []);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Budgets and goals could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The effect starts an external data request; the loader owns its loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const sortedBudgets = useMemo(() => [...budgets].sort((left, right) => {
    if (sort === 'lowest') return Number(left.spentAmount) - Number(right.spentAmount);
    if (sort === 'remaining') return (Number(right.limitAmount) - Number(right.spentAmount)) - (Number(left.limitAmount) - Number(left.spentAmount));
    return Number(right.spentAmount) - Number(left.spentAmount);
  }), [budgets, sort]);

  const exceededCount = budgets.filter((budget) => percentUsed(budget) >= 100).length;
  const nearLimitCount = budgets.filter((budget) => {
    const used = percentUsed(budget);
    return used >= Number(budget.alertThreshold || 80) && used < 100;
  }).length;
  const completedGoals = goals.filter((goal) => Number(goal.targetAmount) > 0 && Number(goal.currentAmount) >= Number(goal.targetAmount)).length;

  function updateBudget(event) { setBudgetForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  function updateGoal(event) { setGoalForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function saveBudget(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = { name: budgetForm.name.trim(), category: budgetForm.category.trim(), limitAmount: Number(budgetForm.limitAmount), alertThreshold: Number(budgetForm.alertThreshold), month: dateOnlyToUtc(budgetForm.month + '-01'), isActive: true };
    try {
      if (editingBudgetId) await financeApi.updateBudget(editingBudgetId, payload);
      else await financeApi.createBudget(payload);
      toast.success(editingBudgetId ? 'Budget updated.' : 'Budget created.');
      setEditingBudgetId(null);
      setBudgetForm(emptyBudget());
      await load();
    } catch (requestError) {
      const message = apiErrorMessage(requestError, 'Budget could not be saved.');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function editBudget(budget) {
    setEditingBudgetId(budget.id);
    setBudgetForm({ name: budget.name, category: budget.category, limitAmount: String(budget.limitAmount), alertThreshold: String(budget.alertThreshold), month: dateInputValue(budget.month).slice(0, 7) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteBudget(id) {
    if (!window.confirm('Delete this budget?')) return;
    try {
      await financeApi.deleteBudget(id);
      toast.success('Budget deleted.');
      await load();
    } catch (requestError) {
      const message = apiErrorMessage(requestError, 'Budget could not be deleted.');
      setError(message);
      toast.error(message);
    }
  }

  async function saveGoal(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = { name: goalForm.name.trim(), targetAmount: Number(goalForm.targetAmount), currentAmount: Number(goalForm.currentAmount), dueDate: dateOnlyToUtc(goalForm.dueDate), color: goalForm.color };
    try {
      if (editingGoalId) await financeApi.updateGoal(editingGoalId, payload);
      else await financeApi.createGoal(payload);
      toast.success(editingGoalId ? 'Savings goal updated.' : 'Savings goal created.');
      setEditingGoalId(null);
      setGoalForm(emptyGoal());
      await load();
    } catch (requestError) {
      const message = apiErrorMessage(requestError, 'Savings goal could not be saved.');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  function editGoal(goal) {
    setEditingGoalId(goal.id);
    setGoalForm({ name: goal.name, targetAmount: String(goal.targetAmount), currentAmount: String(goal.currentAmount), dueDate: dateInputValue(goal.dueDate), color: goal.color || '#18845f' });
  }

  if (loading) return <PageLoading label="Loading budgets and savings goals…" />;
  if (error && budgets.length === 0 && goals.length === 0) return <PageError message={error} onRetry={load} />;

  return (
    <section className="premium-page budgets-page">
      <PageHeader eyebrow="Plan ahead" title="Budgets & goals" description="Set practical spending limits and keep your savings targets visible." />
      {error && <div className="inline-error" role="alert">{error}</div>}

      <section className="budget-summary-grid" aria-label="Budget and goal summary">
        <article className="summary-tile"><span className="summary-tile-icon"><Target size={18} /></span><span><strong>{budgets.length}</strong><small>Budgets</small></span></article>
        <article className="summary-tile summary-tile-warning"><span className="summary-tile-icon"><CircleAlert size={18} /></span><span><strong>{nearLimitCount}</strong><small>Near their limit</small></span></article>
        <article className="summary-tile summary-tile-danger"><span className="summary-tile-icon"><CircleAlert size={18} /></span><span><strong>{exceededCount}</strong><small>Over budget</small></span></article>
        <article className="summary-tile summary-tile-success"><span className="summary-tile-icon"><CircleCheck size={18} /></span><span><strong>{completedGoals} / {goals.length}</strong><small>Goals completed</small></span></article>
      </section>

      <section className="budget-workspace">
        <form className="panel editor budget-editor" onSubmit={saveBudget}>
          <div className="section-head"><div><span className="section-kicker"><Target size={15} /> Spending plan</span><h2>{editingBudgetId ? 'Edit budget' : 'Create a budget'}</h2><p>Choose a category, period, and alert level.</p></div></div>
          <label>Budget name<input name="name" required maxLength={120} value={budgetForm.name} onChange={updateBudget} placeholder="Household essentials" /></label>
          <label>Category<input name="category" required maxLength={80} value={budgetForm.category} onChange={updateBudget} placeholder="Food" /></label>
          <div className="form-row"><label>Budget limit<input name="limitAmount" type="number" required min="0.01" step="0.01" value={budgetForm.limitAmount} onChange={updateBudget} /></label><label>Alert at (%)<input name="alertThreshold" type="number" required min="1" max="100" value={budgetForm.alertThreshold} onChange={updateBudget} /></label></div>
          <label>Budget month<input name="month" type="month" required value={budgetForm.month} onChange={updateBudget} /></label>
          {error && <div className="error-box" role="alert">{error}</div>}
          <div className="actions"><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingBudgetId ? 'Update budget' : <><Plus size={16} /> Create budget</>}</button><button className="btn-secondary" type="button" onClick={() => { setEditingBudgetId(null); setBudgetForm(emptyBudget()); }}>Clear</button></div>
        </form>

        <div className="budget-content">
          <section className="panel budget-toolbar"><div className="section-head"><div><h2>Your budgets</h2><p>Spent totals are matched to each budget’s category and month.</p></div><span className="badge">{budgets.length} total</span></div><label className="sort-control">Sort by<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="highest">Highest spending</option><option value="lowest">Lowest spending</option><option value="remaining">Most remaining</option></select></label></section>

          {sortedBudgets.length ? <section className="budget-grid" aria-label="Budgets">{sortedBudgets.map((budget) => {
            const used = percentUsed(budget);
            const status = used >= 100 ? 'exceeded' : used >= Number(budget.alertThreshold) ? 'warning' : 'safe';
            const remaining = Number(budget.limitAmount) - Number(budget.spentAmount);
            const statusText = status === 'safe' ? 'On track' : status === 'warning' ? 'Near limit' : 'Over budget';
            const progress = Math.max(0, Math.min(100, used));
            return <article className={'panel budget-card ' + status} key={budget.id}>
              <div className="budget-card-head"><span className="budget-card-icon"><Target size={17} /></span><span className={'budget-status ' + status}>{statusText}</span></div>
              <small className="budget-period">{budget.category} <span>·</span> {formatDate(budget.month, { month: 'short', year: 'numeric' })}</small>
              <h3>{budget.name}</h3>
              <div className="budget-progress-copy"><strong>{formatCurrency(budget.spentAmount)}</strong><span>of {formatCurrency(budget.limitAmount)}</span></div>
              <div className={'progress-track ' + status} role="progressbar" aria-label={budget.name + ' spending'} aria-valuenow={Math.round(progress)} aria-valuemin="0" aria-valuemax="100"><span style={{ width: progress + '%' }} /></div>
              <div className="budget-remaining"><span>{Math.round(used)}% used</span><strong className={remaining < 0 ? 'expense-text' : ''}>{formatCurrency(remaining)} remaining</strong></div>
              <div className="actions"><button className="btn-secondary" type="button" onClick={() => editBudget(budget)}>Edit</button><button className="btn-ghost danger-link" type="button" onClick={() => deleteBudget(budget.id)}>Delete</button></div>
            </article>;
          })}</section> : <section className="panel"><EmptyState>No budgets yet. Create a category limit to start tracking spending.</EmptyState></section>}

          <section className="panel goals-panel">
            <div className="section-head"><div><span className="section-kicker"><Flag size={15} /> Long-term planning</span><h2>Savings goals</h2><p>Track progress toward something you’re saving for.</p></div></div>
            <form className="goal-form" onSubmit={saveGoal}>
              <label>Goal name<input name="name" required maxLength={120} value={goalForm.name} onChange={updateGoal} placeholder="Emergency fund" /></label>
              <div className="form-row"><label>Target amount<input name="targetAmount" type="number" min="0.01" step="0.01" required value={goalForm.targetAmount} onChange={updateGoal} /></label><label>Saved so far<input name="currentAmount" type="number" min="0" step="0.01" required value={goalForm.currentAmount} onChange={updateGoal} /></label></div>
              <div className="form-row"><label>Target date<input name="dueDate" type="date" required value={goalForm.dueDate} onChange={updateGoal} /></label><label className="color-field">Progress color<input name="color" type="color" value={goalForm.color} onChange={updateGoal} /></label></div>
              <div className="actions"><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingGoalId ? 'Update goal' : <><Plus size={16} /> Create goal</>}</button>{editingGoalId && <button className="btn-secondary" type="button" onClick={() => { setEditingGoalId(null); setGoalForm(emptyGoal()); }}>Cancel edit</button>}</div>
            </form>
            {goals.length ? <div className="goal-grid">{goals.map((goal) => {
              const target = Number(goal.targetAmount) || 0;
              const saved = Number(goal.currentAmount) || 0;
              const progress = target > 0 ? Math.min(100, Math.max(0, saved / target * 100)) : 0;
              const complete = progress >= 100;
              return <article className="goal-card" key={goal.id}>
                <span className="goal-card-icon" style={{ '--goal-color': goal.color || '#18845f' }}><Flag size={18} /></span>
                <div className="goal-card-heading"><div><h3>{goal.name}</h3><p>{complete ? 'Target reached' : formatCurrency(Math.max(0, target - saved)) + ' left to save'}</p></div>{complete && <CircleCheck size={19} aria-label="Goal completed" />}</div>
                <div className="goal-progress-copy"><strong>{formatCurrency(saved)}</strong><span>of {formatCurrency(target)}</span></div>
                <div className="progress-track" role="progressbar" aria-label={goal.name + ' progress'} aria-valuenow={Math.round(progress)} aria-valuemin="0" aria-valuemax="100"><span style={{ width: progress + '%', backgroundColor: goal.color || '#18845f' }} /></div>
                <small className="goal-due"><CalendarDays size={14} /> Target date {formatDate(goal.dueDate, { dateStyle: 'medium' })}</small>
                <button className="btn-secondary" type="button" onClick={() => editGoal(goal)}>Edit goal</button>
              </article>;
            })}</div> : <EmptyState>No savings goals yet. Set a target and update progress as you go.</EmptyState>}
          </section>
        </div>
      </section>
    </section>
  );
}
