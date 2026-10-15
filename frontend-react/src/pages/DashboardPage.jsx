import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight, ArrowUpRight, CircleDollarSign, Plus, Sparkles, Target, Wallet,
} from 'lucide-react';
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { financeApi } from '../api/finance';
import { apiErrorMessage } from '../api/client';
import { EmptyState, PageError, PageLoading } from '../components/PageState';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/format';

const chartColors = ['#18845f', '#3983b8', '#d48728', '#bd5c54', '#168e8b', '#6f7e59', '#7565a5'];
const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [budgets, setBudgets] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [summaryResult, budgetsResult, goalsResult] = await Promise.allSettled([
        financeApi.dashboard(),
        financeApi.budgets(),
        financeApi.goals(),
      ]);
      if (summaryResult.status !== 'fulfilled') throw summaryResult.reason;
      setSummary(summaryResult.value.data);
      setBudgets(budgetsResult.status === 'fulfilled' ? budgetsResult.value.data || [] : []);
      setGoals(goalsResult.status === 'fulfilled' ? goalsResult.value.data || [] : []);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Dashboard data could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The effect starts external data requests; the loader owns the loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const monthly = useMemo(() => summary?.monthlyTotals || [], [summary]);
  const categories = useMemo(() => summary?.categoryTotals || [], [summary]);
  const savings = useMemo(() => monthly.map((item) => ({
    month: item.month,
    savings: Number(item.income || 0) - Number(item.expenses || 0),
  })), [monthly]);
  const fullName = user?.fullName?.trim() || '';
  const firstName = fullName.split(/\s+/)[0] || 'there';
  const today = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());
  const suggestions = summary?.suggestions || [];
  const transactions = summary?.recentTransactions || [];

  if (loading) return <PageLoading label="Loading your financial summary…" />;
  if (error) return <PageError message={error} onRetry={load} />;

  return (
    <section className="dashboard-page premium-page">
      <PageHeader
        eyebrow={today}
        title={greeting() + ', ' + firstName}
        description="Your cash flow and spending overview, using activity recorded in your account."
        actions={<Link className="btn-primary" to="/app/transactions"><Plus size={17} /> Add transaction</Link>}
      />

      <section className="summary-grid" aria-label="Financial summary">
        <article className="metric summary-card balance-card">
          <div className="metric-topline"><span>Net balance</span><span className="metric-icon"><Wallet size={18} /></span></div>
          <strong>{formatCurrency(summary?.balance)}</strong>
          <small>Across recorded activity</small>
        </article>
        <article className="metric summary-card income-card">
          <div className="metric-topline"><span>Total income</span><span className="metric-icon"><ArrowDownRight size={18} /></span></div>
          <strong>{formatCurrency(summary?.income)}</strong>
          <small>Income recorded in your account</small>
        </article>
        <article className="metric summary-card expense-card">
          <div className="metric-topline"><span>Total expenses</span><span className="metric-icon"><ArrowUpRight size={18} /></span></div>
          <strong>{formatCurrency(summary?.expenses)}</strong>
          <small>Spending recorded in your account</small>
        </article>
        <article className="metric summary-card savings-card">
          <div className="metric-topline"><span>Savings rate</span><span className="metric-icon"><CircleDollarSign size={18} /></span></div>
          <strong>{Number(summary?.savingsRate || 0).toFixed(1)}%</strong>
          <small>Based on recorded income and expenses</small>
        </article>
      </section>

      <section className="dashboard-chart-grid" aria-label="Financial charts">
        <article className="panel dashboard-panel cashflow-panel">
          <div className="section-head"><div><h2>Income and spending</h2><p>Monthly totals from your transactions</p></div></div>
          <div className="chart-container chart-recharts">
            {monthly.length ? <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} width={86} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="income" name="Income" fill="var(--chart-income)" radius={[5, 5, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="var(--chart-expense)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer> : <EmptyState>Add transactions to see your monthly cash flow.</EmptyState>}
          </div>
        </article>

        <article className="panel dashboard-panel category-panel">
          <div className="section-head"><div><h2>Spending by category</h2><p>Distribution of recorded expenses</p></div></div>
          <div className="chart-container chart-recharts">
            {categories.length ? <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categories} dataKey="total" nameKey="category" innerRadius="58%" outerRadius="76%" paddingAngle={2}>
                  {categories.map((item, index) => <Cell key={item.category} fill={chartColors[index % chartColors.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer> : <EmptyState>Add expenses to see category totals.</EmptyState>}
          </div>
        </article>

        <article className="panel dashboard-panel savings-panel">
          <div className="section-head"><div><h2>Monthly net movement</h2><p>Income minus expenses for each period</p></div></div>
          <div className="chart-container chart-recharts">
            {monthly.length ? <ResponsiveContainer width="100%" height="100%">
              <LineChart data={savings} margin={{ top: 10, right: 8, left: -14, bottom: 0 }}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(value) => formatCurrency(value)} width={86} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line type="monotone" dataKey="savings" name="Net movement" stroke="var(--chart-savings)" strokeWidth={2.5} dot={{ fill: 'var(--chart-savings)', r: 3 }} />
              </LineChart>
            </ResponsiveContainer> : <EmptyState>Add transactions to see monthly net movement.</EmptyState>}
          </div>
        </article>
      </section>

      <section className="dashboard-lower-grid">
        <article className="panel dashboard-panel recent-panel">
          <div className="section-head"><div><h2>Recent transactions</h2><p>Your latest recorded activity</p></div><Link className="text-link" to="/app/transactions">All transactions <span aria-hidden="true">→</span></Link></div>
          {transactions.length ? <div className="recent-list">{transactions.map((item) => (
            <div className="recent-row" key={item.id}>
              <span className={'transaction-type-icon ' + (item.type === 'Income' ? 'is-income' : 'is-expense')}>{item.type === 'Income' ? <ArrowDownRight size={17} /> : <ArrowUpRight size={17} />}</span>
              <span className="recent-copy"><strong>{item.title}</strong><small>{item.category} · {formatDate(item.date)}</small></span>
              <strong className={'recent-amount ' + (item.type === 'Income' ? 'success' : 'expense-text')}>{item.type === 'Income' ? '+' : '−'}{formatCurrency(item.amount)}</strong>
            </div>
          ))}</div> : <EmptyState>No transactions yet. Add one to begin tracking your cash flow.</EmptyState>}
        </article>

        <article className="panel dashboard-panel insights-panel">
          <div className="section-head"><div><h2>Financial insights</h2><p>Suggestions returned by your API</p></div><span className="section-icon"><Sparkles size={17} /></span></div>
          {suggestions.length ? <div className="insight-list">{suggestions.map((item, index) => (
            <div className="dashboard-insight" key={index}><span>{String(index + 1).padStart(2, '0')}</span><p>{item}</p></div>
          ))}</div> : <EmptyState>There are no suggestions for this account yet.</EmptyState>}
          <Link className="btn-secondary" to="/app/reports">Open reports</Link>
        </article>

        <article className="panel dashboard-panel budget-preview-panel">
          <div className="section-head"><div><h2>Budget progress</h2><p>Current allocations and category spending</p></div><Link className="text-link" to="/app/budgets">Manage budgets <span aria-hidden="true">→</span></Link></div>
          {budgets.length ? <div className="progress-list">{budgets.slice(0, 4).map((budget) => {
            const limit = Number(budget.limitAmount) || 0;
            const spent = Number(budget.spentAmount) || 0;
            const percentage = limit > 0 ? spent / limit * 100 : 0;
            const status = percentage >= 100 ? 'over' : percentage >= Number(budget.alertThreshold || 80) ? 'near' : '';
            return <div className="budget-preview-row" key={budget.id}>
              <div><strong>{budget.name}</strong><span>{formatCurrency(spent)} of {formatCurrency(limit)}</span></div>
              <div className={'progress-track ' + status} role="progressbar" aria-label={budget.name + ' budget used'} aria-valuenow={Math.round(percentage)} aria-valuemin="0" aria-valuemax="100"><span style={{ width: clampPercent(percentage) + '%' }} /></div>
            </div>;
          })}</div> : <EmptyState>No budgets yet. Create one to keep a category limit in view.</EmptyState>}
        </article>

        <article className="panel dashboard-panel goals-preview-panel">
          <div className="section-head"><div><h2>Savings goals</h2><p>Progress toward your targets</p></div><Link className="text-link" to="/app/budgets">View goals <span aria-hidden="true">→</span></Link></div>
          {goals.length ? <div className="progress-list">{goals.slice(0, 3).map((goal) => {
            const target = Number(goal.targetAmount) || 0;
            const saved = Number(goal.currentAmount) || 0;
            const percentage = target > 0 ? saved / target * 100 : 0;
            const complete = percentage >= 100;
            return <div className="goal-preview-row" key={goal.id}>
              <div className="goal-preview-heading"><span className="goal-marker"><Target size={16} /></span><span><strong>{goal.name}</strong><small>{complete ? 'Target reached' : formatCurrency(Math.max(0, target - saved)) + ' to go'}</small></span><b>{Math.round(clampPercent(percentage))}%</b></div>
              <div className="progress-track" role="progressbar" aria-label={goal.name + ' progress'} aria-valuenow={Math.round(clampPercent(percentage))} aria-valuemin="0" aria-valuemax="100"><span style={{ width: clampPercent(percentage) + '%' }} /></div>
            </div>;
          })}</div> : <EmptyState>No savings goals yet. Set a target in Budgets & goals.</EmptyState>}
        </article>
      </section>

      <div className="dashboard-refresh"><button className="btn-ghost" type="button" onClick={load}>Refresh overview</button></div>
    </section>
  );
}
