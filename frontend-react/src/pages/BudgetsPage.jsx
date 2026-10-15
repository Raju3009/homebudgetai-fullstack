import { useCallback, useEffect, useMemo, useState } from 'react';
import { financeApi } from '../api/finance';
import { apiErrorMessage } from '../api/client';
import { EmptyState, PageError, PageLoading } from '../components/PageState';
import { formatCurrency, formatDate, dateInputValue, dateOnlyToUtc } from '../utils/format';
import { useToast } from '../context/ToastContext';

const localMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};
const emptyBudget = () => ({ name: '', category: 'Food', limitAmount: '1000', alertThreshold: '80', month: localMonth() });
const emptyGoal = () => ({ name: '', targetAmount: '', currentAmount: '0', dueDate: '', color: '#10b981' });
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

  function updateBudget(event) { setBudgetForm((current) => ({ ...current, [event.target.name]: event.target.value })); }
  function updateGoal(event) { setGoalForm((current) => ({ ...current, [event.target.name]: event.target.value })); }

  async function saveBudget(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = { name: budgetForm.name.trim(), category: budgetForm.category.trim(), limitAmount: Number(budgetForm.limitAmount), alertThreshold: Number(budgetForm.alertThreshold), month: dateOnlyToUtc(`${budgetForm.month}-01`), isActive: true };
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
    setGoalForm({ name: goal.name, targetAmount: String(goal.targetAmount), currentAmount: String(goal.currentAmount), dueDate: dateInputValue(goal.dueDate), color: goal.color || '#10b981' });
  }

  if (loading) return <PageLoading label="Loading budgets and savings goals…" />;
  if (error && budgets.length === 0 && goals.length === 0) return <PageError message={error} onRetry={load} />;

  return (
    <section className="workspace premium-page budgets-page">
      <form className="panel editor budget-editor" onSubmit={saveBudget}>
        <div className="section-head"><div><h2>{editingBudgetId ? 'Edit budget' : 'Create budget'}</h2><p>Set a spending limit and alert threshold.</p></div><span className="badge success">Account tracking</span></div>
        <label>Budget Name<input name="name" required maxLength={120} value={budgetForm.name} onChange={updateBudget} placeholder="Groceries" /></label>
        <label>Category<input name="category" required maxLength={80} value={budgetForm.category} onChange={updateBudget} placeholder="Food" /></label>
        <div className="form-row"><label>Allocated Amount<input name="limitAmount" type="number" required min="0.01" step="0.01" value={budgetForm.limitAmount} onChange={updateBudget} /></label><label>Alert Threshold %<input name="alertThreshold" type="number" required min="1" max="100" value={budgetForm.alertThreshold} onChange={updateBudget} /></label></div>
        <label>Budget Month<input name="month" type="month" required value={budgetForm.month} onChange={updateBudget} /></label>
        {error && <div className="error-box" role="alert">{error}</div>}
        <div className="actions"><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save budget'}</button><button className="btn-secondary" type="button" onClick={() => { setEditingBudgetId(null); setBudgetForm(emptyBudget()); }}>Clear</button></div>
      </form>

      <div className="budget-content">
        <section className="panel full budget-toolbar"><div className="section-head"><div><h2>Budget health</h2><p>Spending is calculated from expenses inside each budget month.</p></div></div><label className="sort-control"><span>Sort budgets</span><select value={sort} onChange={(event) => setSort(event.target.value)}><option value="highest">Highest spending</option><option value="lowest">Lowest spending</option><option value="remaining">Most remaining</option></select></label></section>

        {sortedBudgets.length ? <section className="budget-grid">{sortedBudgets.map((budget) => {
          const used = percentUsed(budget);
          const status = used >= 100 ? 'exceeded' : used >= Number(budget.alertThreshold) ? 'warning' : 'safe';
          const remaining = Number(budget.limitAmount) - Number(budget.spentAmount);
          return <article className={`panel budget-card ${status}`} key={budget.id}><div className="budget-card-head"><div><small>{budget.category} · {formatDate(budget.month, { month: 'short', year: 'numeric' })}</small><h2>{budget.name}</h2></div><span className="budget-status">{status === 'safe' ? 'Safe' : status === 'warning' ? 'Warning' : 'Exceeded'}</span></div><div className="budget-amounts"><span><small>Allocated</small><strong>{formatCurrency(budget.limitAmount)}</strong></span><span><small>Spent in month</small><strong>{formatCurrency(budget.spentAmount)}</strong></span><span><small>Remaining</small><strong className={remaining < 0 ? 'error' : ''}>{formatCurrency(remaining)}</strong></span></div><div className="progress-line budget-progress"><span style={{ width: `${Math.min(100, Math.max(0, used))}%` }} /></div><p className="muted">{used.toFixed(0)}% used{remaining < 0 ? '. Spending exceeds this limit.' : '.'}</p><div className="actions"><button className="btn-secondary" type="button" onClick={() => editBudget(budget)}>Edit</button><button className="btn-ghost error" type="button" onClick={() => deleteBudget(budget.id)}>Delete</button></div></article>;
        })}</section> : <section className="panel full"><EmptyState>No budgets yet. Create one to start monitoring spending.</EmptyState></section>}

        <section className="panel full goals-panel"><div className="section-head"><div><h2>Savings goals</h2><p>Create a goal or update its progress.</p></div></div>
          <form className="goal-form" onSubmit={saveGoal}><label>Goal Name<input name="name" required maxLength={120} value={goalForm.name} onChange={updateGoal} placeholder="Emergency fund" /></label><div className="form-row"><label>Target Amount<input name="targetAmount" type="number" min="0.01" step="0.01" required value={goalForm.targetAmount} onChange={updateGoal} /></label><label>Current Amount<input name="currentAmount" type="number" min="0" step="0.01" required value={goalForm.currentAmount} onChange={updateGoal} /></label></div><div className="form-row"><label>Due Date<input name="dueDate" type="date" required value={goalForm.dueDate} onChange={updateGoal} /></label><label>Progress Color<input name="color" type="color" value={goalForm.color} onChange={updateGoal} /></label></div><div className="actions"><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingGoalId ? 'Update goal' : 'Create goal'}</button>{editingGoalId && <button className="btn-secondary" type="button" onClick={() => { setEditingGoalId(null); setGoalForm(emptyGoal()); }}>Cancel edit</button>}</div></form>
          {goals.length ? <div className="quick-grid goal-grid">{goals.map((goal) => { const progress = Number(goal.targetAmount) > 0 ? Math.min(100, Math.max(0, Number(goal.currentAmount) / Number(goal.targetAmount) * 100)) : 0; return <article className="quick-action goal-card" key={goal.id}><strong>{goal.name}</strong><small>{formatCurrency(goal.currentAmount)} of {formatCurrency(goal.targetAmount)}</small><div className="progress-line"><span style={{ width: `${progress}%`, backgroundColor: goal.color }} /></div><small>{progress.toFixed(0)}% · due {formatDate(goal.dueDate, { dateStyle: 'medium' })}</small><button className="btn-secondary" type="button" onClick={() => editGoal(goal)}>Edit goal</button></article>; })}</div> : <EmptyState>No savings goals yet.</EmptyState>}
        </section>
      </div>
    </section>
  );
}
