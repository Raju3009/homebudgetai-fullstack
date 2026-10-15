import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { transactionsApi } from '../api/transactions';
import { apiErrorMessage } from '../api/client';
import { EmptyState } from '../components/PageState';
import { formatCurrency, formatDate, dateInputValue, dateOnlyToUtc } from '../utils/format';
import { useToast } from '../context/ToastContext';

const emptyForm = () => ({ title: '', category: 'Food', amount: '', type: 'Expense', date: new Date().toISOString().slice(0, 10), notes: '' });
const categoryChoices = ['Food', 'Housing', 'Utilities', 'Transport', 'Salary', 'Side Income', 'Savings', 'Healthcare', 'Entertainment'];

export default function TransactionWorkspace({ expenseOnly = false }) {
  const [searchParams] = useSearchParams();
  const routeQuery = searchParams.get('q') || '';
  const toast = useToast();
  const [filters, setFilters] = useState(() => ({ q: routeQuery, category: '', type: expenseOnly ? 'Expense' : '', from: '', to: '' }));
  const [draft, setDraft] = useState(() => ({ q: routeQuery, category: '', type: expenseOnly ? 'Expense' : '', from: '', to: '' }));
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sort, setSort] = useState({ key: 'date', direction: 'desc' });

  useEffect(() => {
    // Keep the search form synchronized with navigation from the app header.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDraft((current) => ({ ...current, q: routeQuery }));
    setFilters((current) => ({ ...current, q: routeQuery }));
    setPage(1);
  }, [routeQuery]);

  const load = useCallback(async (requestedPage, signal) => {
    setLoading(true);
    setError('');
    try {
      const params = { ...filters, type: expenseOnly ? 'Expense' : filters.type, page: requestedPage, pageSize: 10 };
      Object.keys(params).forEach((key) => { if (params[key] === '') delete params[key]; });
      const { data } = await transactionsApi.list(params, { signal });
      if (signal?.aborted) return;
      setRows(data.items || []);
      setTotalPages(Math.max(Number(data.totalPages) || 1, 1));
      setTotalItems(Number(data.totalItems) || 0);
      setPage(Number(data.page) || requestedPage);
    } catch (requestError) {
      if (signal?.aborted || requestError.code === 'ERR_CANCELED') return;
      setError(apiErrorMessage(requestError, `Unable to load ${expenseOnly ? 'expenses' : 'transactions'}.`));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [expenseOnly, filters]);

  useEffect(() => {
    const controller = new AbortController();
    // The effect starts an abortable external data request; the loader owns its state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(page, controller.signal);
    return () => controller.abort();
  }, [load, page]);

  const sortedRows = useMemo(() => [...rows].sort((left, right) => {
    const a = sort.key === 'amount' ? Number(left.amount) : sort.key === 'title' ? left.title.toLowerCase() : new Date(left.date).getTime();
    const b = sort.key === 'amount' ? Number(right.amount) : sort.key === 'title' ? right.title.toLowerCase() : new Date(right.date).getTime();
    return (a < b ? -1 : a > b ? 1 : 0) * (sort.direction === 'asc' ? 1 : -1);
  }), [rows, sort]);

  function updateDraft(event) {
    setDraft((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function updateForm(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function applyFilters(event) {
    event.preventDefault();
    setFilters({ ...draft, type: expenseOnly ? 'Expense' : draft.type });
    setPage(1);
  }

  function beginEdit(row) {
    setEditingId(row.id);
    setForm({ title: row.title, category: row.category, amount: String(row.amount), type: expenseOnly ? 'Expense' : row.type, date: dateInputValue(row.date), notes: row.notes || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
    setError('');
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    const payload = { title: form.title.trim(), category: form.category.trim(), amount: Number(form.amount), type: expenseOnly ? 'Expense' : form.type, date: dateOnlyToUtc(form.date), notes: form.notes.trim() || null };
    try {
      if (editingId) await transactionsApi.update(editingId, payload);
      else await transactionsApi.create(payload);
      toast.success(editingId ? 'Transaction updated.' : 'Transaction added.');
      resetForm();
      await load(page);
    } catch (requestError) {
      const message = apiErrorMessage(requestError, 'Unable to save the transaction.');
      setError(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(id) {
    if (!window.confirm('Delete this transaction?')) return;
    try {
      await transactionsApi.remove(id);
      toast.success('Transaction deleted.');
      await load(page);
    } catch (requestError) {
      const message = apiErrorMessage(requestError, 'Unable to delete the transaction.');
      setError(message);
      toast.error(message);
    }
  }

  function toggleSort(key) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
  }

  async function exportCsv() {
    try {
      const params = { ...filters, type: expenseOnly ? 'Expense' : filters.type };
      Object.keys(params).forEach((key) => { if (params[key] === '') delete params[key]; });
      const { data } = await transactionsApi.exportCsv(params);
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = expenseOnly ? 'homebudget-expenses.csv' : 'homebudget-transactions.csv';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.success('CSV export downloaded.');
    } catch (requestError) {
      toast.error(apiErrorMessage(requestError, 'CSV export failed.'));
    }
  }

  const title = expenseOnly ? 'Expenses' : 'Transactions';

  return (
    <section className="workspace premium-page">
      <form className="panel editor" onSubmit={save}>
        <div className="section-head"><div><h2>{editingId ? `Edit ${expenseOnly ? 'expense' : 'transaction'}` : `Add ${expenseOnly ? 'expense' : 'transaction'}`}</h2><p>Record an income or expense in your account.</p></div><span className="badge">Secure form</span></div>
        <label>Title<input name="title" required maxLength={160} value={form.title} onChange={updateForm} placeholder="Groceries, salary, rent" /></label>
        <label>Category<input name="category" required maxLength={80} list="transaction-categories" value={form.category} onChange={updateForm} placeholder="Food" /><datalist id="transaction-categories">{categoryChoices.map((category) => <option value={category} key={category} />)}</datalist></label>
        <div className="form-row"><label>Amount<input name="amount" type="number" required min="0.01" step="0.01" value={form.amount} onChange={updateForm} /></label>{!expenseOnly && <label>Type<select name="type" value={form.type} onChange={updateForm}><option value="Expense">Expense</option><option value="Income">Income</option></select></label>}</div>
        <label>Date<input name="date" type="date" required value={form.date} onChange={updateForm} /></label>
        <label>Notes<textarea name="notes" maxLength={500} value={form.notes} onChange={updateForm} placeholder="Optional note" /></label>
        {error && <div className="error-box" role="alert">{error}</div>}
        <div className="actions"><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update' : 'Add'} {expenseOnly ? 'expense' : 'transaction'}</button><button className="btn-secondary" type="button" onClick={resetForm}>Clear</button></div>
      </form>

      <section className="panel table-panel">
        <div className="section-head"><div><h2>{title}</h2><p>Search, filter, sort, paginate, and export.</p></div><button type="button" className="btn-primary" onClick={exportCsv}>Export CSV</button></div>
        <form className="filters transaction-filters" onSubmit={applyFilters}>
          <input name="q" aria-label="Search transactions" placeholder="Search" value={draft.q} onChange={updateDraft} />
          <input name="category" aria-label="Filter by category" placeholder="Category" value={draft.category} onChange={updateDraft} />
          {!expenseOnly && <select name="type" aria-label="Filter by type" value={draft.type} onChange={updateDraft}><option value="">All types</option><option value="Expense">Expense</option><option value="Income">Income</option></select>}
          <label className="date-filter">From<input name="from" type="date" value={draft.from} onChange={updateDraft} /></label><label className="date-filter">To<input name="to" type="date" value={draft.to} onChange={updateDraft} /></label>
          <button className="btn-secondary" type="submit">Filter</button>
        </form>
        {error && <div className="inline-error" role="alert">{error}<button className="btn-secondary" type="button" onClick={() => load(page)}>Retry</button></div>}
        {loading ? <div className="panel skeleton table-skeleton" role="status" aria-label={`Loading ${title.toLowerCase()}`} /> : rows.length === 0 ? <EmptyState>No {expenseOnly ? 'expenses' : 'transactions'} match this view. Add a row to start tracking.</EmptyState> : (
          <div className="table-wrap"><table><thead><tr><th><button type="button" className="table-sort" onClick={() => toggleSort('date')}>Date</button></th><th><button type="button" className="table-sort" onClick={() => toggleSort('title')}>Title</button></th><th>Category</th><th>Type</th><th><button type="button" className="table-sort" onClick={() => toggleSort('amount')}>Amount</button></th><th>Actions</th></tr></thead><tbody>{sortedRows.map((row) => <tr key={row.id}><td>{formatDate(row.date)}</td><td><strong>{row.title}</strong>{row.notes && <small>{row.notes}</small>}</td><td>{row.category}</td><td><span className={`badge ${row.type === 'Income' ? 'income' : 'expense'}`}>{row.type}</span></td><td className={row.type === 'Income' ? 'success' : 'error'}>{formatCurrency(row.amount)}</td><td><div className="row-actions"><button className="btn-secondary" type="button" onClick={() => beginEdit(row)}>Edit</button><button className="btn-ghost error" type="button" onClick={() => remove(row.id)}>Delete</button></div></td></tr>)}</tbody></table></div>
        )}
        <div className="pager"><span>{totalItems} results · Page {page} of {totalPages}</span><div><button className="btn-secondary" type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button><button className="btn-secondary" type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>
      </section>
    </section>
  );
}
