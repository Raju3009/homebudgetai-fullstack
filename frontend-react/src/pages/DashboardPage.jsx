import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { financeApi } from '../api/finance';
import { apiErrorMessage } from '../api/client';
import { EmptyState, PageError, PageLoading } from '../components/PageState';
import { formatCurrency, formatDate } from '../utils/format';

const chartColors = ['#0f766e', '#2563eb', '#f97316', '#dc2626', '#0891b2', '#16a34a', '#7c3aed'];
const clampPercent = (value) => Math.max(0, Math.min(100, Number(value) || 0));

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await financeApi.dashboard();
      setSummary(data);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Dashboard data could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The effect starts an external data request; the loader owns its loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const monthly = useMemo(() => summary?.monthlyTotals || [], [summary]);
  const categories = useMemo(() => summary?.categoryTotals || [], [summary]);
  const savings = useMemo(() => monthly.map((item) => ({ month: item.month, savings: Number(item.income) - Number(item.expenses) })), [monthly]);
  const healthScore = useMemo(() => {
    const income = Number(summary?.income || 0);
    const expenses = Number(summary?.expenses || 0);
    if (income <= 0) return 0;
    const savingsRate = clampPercent(summary?.savingsRate);
    const spendingControl = clampPercent(100 - (expenses / income) * 100);
    return Math.round(savingsRate * 0.55 + spendingControl * 0.45);
  }, [summary]);

  if (loading) return <PageLoading label="Loading your financial summary…" />;
  if (error) return <PageError message={error} onRetry={load} />;

  const suggestions = summary?.suggestions || [];
  const transactions = summary?.recentTransactions || [];
  const balance = Number(summary?.balance || 0);
  const healthLabel = healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'Review' : 'Needs attention';

  return (
    <section className="dashboard-page premium-page">
      <section className="welcome-panel">
        <div><span className="badge success">Account summary</span><h2>Welcome back</h2><p>{healthScore >= 70 ? 'Your recorded cash flow shows positive savings momentum.' : healthScore >= 40 ? 'Review your categories and keep an eye on spending.' : 'Add transactions and review your financial trends.'}</p></div>
        <div className="welcome-stats"><article><small>Savings rate</small><strong>{Number(summary?.savingsRate || 0).toFixed(1)}%</strong><div className="progress-line"><span style={{ width: `${clampPercent(summary?.savingsRate)}%` }} /></div></article><article><small>Budget health</small><strong>{healthScore}/100</strong><div className="score-ring" style={{ '--score': `${healthScore}%` }}><span>{healthScore}</span></div></article></div>
      </section>

      <section className="page-grid">
        <article className="metric dashboard-metric income-card"><div className="metric-icon">+</div><span>Total income</span><strong>{formatCurrency(summary?.income)}</strong><small className="badge success">Recorded transactions</small></article>
        <article className="metric dashboard-metric expense-card"><div className="metric-icon">−</div><span>Total expenses</span><strong>{formatCurrency(summary?.expenses)}</strong><small className="badge expense">Recorded transactions</small></article>
        <article className="metric dashboard-metric savings-card"><div className="metric-icon">%</div><span>Net savings</span><strong>{formatCurrency(Number(summary?.income || 0) - Number(summary?.expenses || 0))}</strong><small className="badge success">{Number(summary?.savingsRate || 0).toFixed(1)}% savings rate</small></article>
        <article className="metric dashboard-metric remaining-card"><div className="metric-icon">=</div><span>Net balance</span><strong>{formatCurrency(balance)}</strong><small className={`badge ${balance < 0 ? 'danger' : 'success'}`}>{balance >= 0 ? 'Positive net balance' : 'Expenses exceed income'}</small></article>

        <section className="panel wide"><div className="section-head"><div><h2>Income vs Expenses</h2><p>Monthly cash flow from your transactions</p></div><span className="badge">{monthly.length} months</span></div><div className="chart-container chart-recharts">{monthly.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tickFormatter={(value) => formatCurrency(value)} width={90} /><Tooltip formatter={(value) => formatCurrency(value)} /><Legend /><Bar dataKey="income" name="Income" fill="#0f766e" radius={[8, 8, 0, 0]} /><Bar dataKey="expenses" name="Expenses" fill="#f97316" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer> : <EmptyState>Add transactions to chart your monthly cash flow.</EmptyState>}</div></section>

        <section className="panel"><div className="section-head"><div><h2>Category analytics</h2><p>Expense distribution</p></div></div><div className="chart-container chart-recharts">{categories.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="total" nameKey="category" innerRadius="55%" outerRadius="78%" paddingAngle={3}>{categories.map((item, index) => <Cell key={item.category} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(value)} /><Legend /></PieChart></ResponsiveContainer> : <EmptyState>Add expenses to build your category map.</EmptyState>}</div></section>

        <section className="panel wide"><div className="section-head"><div><h2>Savings trend</h2><p>Monthly income minus expenses</p></div></div><div className="chart-container chart-recharts">{monthly.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={savings}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="month" tick={{ fontSize: 12 }} /><YAxis tickFormatter={(value) => formatCurrency(value)} width={90} /><Tooltip formatter={(value) => formatCurrency(value)} /><Line type="monotone" dataKey="savings" name="Net savings" stroke="#2563eb" strokeWidth={3} dot={{ fill: '#0f766e', r: 4 }} /></LineChart></ResponsiveContainer> : <EmptyState>Add transactions to chart savings movement.</EmptyState>}</div></section>

        <section className="panel ai-card premium-ai-panel"><div className="ai-card-content"><div className="section-head"><div><h2>Financial insights</h2><p>Suggestions from the API analysis</p></div></div><div className="ai-suggestions">{suggestions.map((item, index) => <article className="suggestion" key={`${index}-${item}`}><div className="suggestion-title"><span className="suggestion-icon">AI</span>Suggestion {index + 1}</div><p>{item}</p></article>)}</div>{suggestions.length === 0 && <EmptyState>There are no suggestions for this account yet.</EmptyState>}<Link className="btn-secondary" to="/app/reports">Open reports</Link></div></section>

        <section className="panel full"><div className="section-head"><div><h2>Quick actions</h2><p>Open a finance workflow</p></div></div><div className="quick-grid action-grid"><Link className="quick-action action-card" to="/app/expenses"><span>−</span><strong>Add expense</strong><small>Record a new spend</small></Link><Link className="quick-action action-card" to="/app/budgets"><span>+</span><strong>Add budget</strong><small>Create a spending limit</small></Link><Link className="quick-action action-card" to="/app/reports"><span>AI</span><strong>Review insights</strong><small>Read the latest suggestions</small></Link><Link className="quick-action action-card" to="/app/transactions"><span>CSV</span><strong>View transactions</strong><small>Search and export rows</small></Link></div></section>

        <section className="panel budget-health"><div className="section-head"><div><h2>Budget health</h2><p>Based on your account totals</p></div><span className="badge success">{healthLabel}</span></div><div className="health-grid"><article><span>Spending control</span><strong>{Number(summary?.expenses || 0) <= Number(summary?.income || 0) ? 'Within income' : 'Review now'}</strong><small>Compare recorded expenses with income.</small></article><article><span>Savings rate</span><strong>{clampPercent(summary?.savingsRate).toFixed(0)}%</strong><small>Keep a positive monthly trend.</small></article><article><span>Next workflow</span><strong>Plan a budget</strong><small>Set category limits in Budgets.</small></article></div></section>

        <section className="panel"><div className="section-head"><div><h2>Top categories</h2><p>Highest expense categories</p></div></div>{categories.map((item) => <div className="category-row" key={item.category}><span>{item.category}</span><strong>{formatCurrency(item.total)}</strong></div>)}{categories.length === 0 && <EmptyState>No expense categories are available.</EmptyState>}</section>

        <section className="panel wide"><div className="section-head"><div><h2>Recent transactions</h2><p>Latest financial activity</p></div><Link className="btn-secondary" to="/app/transactions">Manage</Link></div>{transactions.map((item) => <div className="category-row transaction-row" key={item.id}><span>{item.title}<small>{item.category} · {formatDate(item.date)}</small></span><strong className={item.type === 'Income' ? 'success' : 'error'}>{item.type === 'Income' ? '+' : '−'}{formatCurrency(item.amount)}</strong></div>)}{transactions.length === 0 && <EmptyState>Add a transaction to start tracking your financial activity.</EmptyState>}</section>
      </section>
      <div className="dashboard-refresh"><button className="btn-secondary" type="button" onClick={load}>Refresh summary</button></div>
    </section>
  );
}
