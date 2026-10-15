import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ArrowUpDown, Plus, Search, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { transactionsApi } from '../api/transactions';
import { apiErrorMessage } from '../api/client';
import { EmptyState } from '../components/PageState';
import PageHeader from '../components/PageHeader';
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
    // Keep the filter form in sync with search submitted from the app header.
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
      setError(apiErrorMessage(requestError, 'Unable to load account activity.'));
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [expenseOnly, filters]);

  useEffect(() => {
    const controller = new AbortController();
    // The effect starts an abortable external request; the loader owns its loading state.
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
  const description = expenseOnly
    ? 'Review and manage expense records with category and date filters.'
    : 'Search, organize, and update income and expense activity.';

  return (
    <section className="transaction-workspace premium-page">
      <PageHeader
        eyebrow="Money management"
        title={title}
        description={description}
        actions={<button className="btn-secondary" type="button" onClick={exportCsv}><ArrowDownToLine size={16} /> Export CSV</button>}
      />

      <div className="workspace">
        <form className="panel editor transaction-editor" onSubmit={save}>
          <div className="section-head"><div><span className="section-kicker"><Plus size={15} /> Record activity</span><h2>{editingId ? 'Edit record' : 'New ' + (expenseOnly ? 'expense' : 'transaction')}</h2><p>Changes are saved to your account.</p></div></div>
          <label>Description<input name="title" required maxLength={160} value={form.title} onChange={updateForm} placeholder="Groceries, salary, rent" /></label>
          <label>Category<input name="category" required maxLength={80} list="transaction-categories" value={form.category} onChange={updateForm} placeholder="Food" /><datalist id="transaction-categories">{categoryChoices.map((category) => <option value={category} key={category} />)}</datalist></label>
          <div className="form-row"><label>Amount<input name="amount" type="number" required min="0.01" step="0.01" value={form.amount} onChange={updateForm} placeholder="0.00" /></label>{!expenseOnly && <label>Type<select name="type" value={form.type} onChange={updateForm}><option value="Expense">Expense</option><option value="Income">Income</option></select></label>}</div>
          <label>Date<input name="date" type="date" required value={form.date} onChange={updateForm} /></label>
          <label>Notes <span className="optional-label">Optional</span><textarea name="notes" maxLength={500} value={form.notes} onChange={updateForm} placeholder="Add a note for this record" /></label>
          {error && <div className="error-box" role="alert">{error}</div>}
          <div className="actions"><button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : <><Plus size={16} /> Add {expenseOnly ? 'expense' : 'transaction'}</>}</button><button className="btn-secondary" type="button" onClick={resetForm}>Clear</button></div>
        </form>

        <section className="panel table-panel">
          <div className="section-head"><div><h2>Account activity</h2><p>{totalItems} {expenseOnly ? 'expense' : 'transaction'} records</p></div></div>
          <form className="filters transaction-filters" onSubmit={applyFilters}>
            <label className="search-field"><Search size={16} /><input name="q" aria-label="Search transactions" placeholder="Search descriptions" value={draft.q} onChange={updateDraft} /></label>
            <input name="category" aria-label="Filter by category" placeholder="Category" value={draft.category} onChange={updateDraft} />
            {!expenseOnly && <select name="type" aria-label="Filter by type" value={draft.type} onChange={updateDraft}><option value="">All types</option><option value="Expense">Expense</option><option value="Income">Income</option></select>}
            <label className="date-filter">From<input name="from" type="date" value={draft.from} onChange={updateDraft} /></label>
            <label className="date-filter">To<input name="to" type="date" value={draft.to} onChange={updateDraft} /></label>
            <button className="btn-secondary" type="submit">Apply filters</button>
          </form>
          {error && <div className="inline-error" role="alert">{error}<button className="btn-secondary" type="button" onClick={() => load(page)}>Retry</button></div>}
          {loading ? <div className="table-skeleton" role="status" aria-label={'Loading ' + title.toLowerCase()} /> : rows.length === 0 ? <EmptyState>No {expenseOnly ? 'expenses' : 'transactions'} match these filters.</EmptyState> : (
            <div className="table-wrap"><table className="transaction-table"><thead><tr><th><button type="button" className="table-sort" onClick={() => toggleSort('date')}>Date <ArrowUpDown size={13} /></button></th><th><button type="button" className="table-sort" onClick={() => toggleSort('title')}>Description <ArrowUpDown size={13} /></button></th><th>Category</th><th>Type</th><th><button type="button" className="table-sort" onClick={() => toggleSort('amount')}>Amount <ArrowUpDown size={13} /></button></th><th>Actions</th></tr></thead><tbody>{sortedRows.map((row) => (
              <tr key={row.id}>
                <td data-label="Date">{formatDate(row.date)}</td>
                <td data-label="Description"><strong>{row.title}</strong>{row.notes && <small>{row.notes}</small>}</td>
                <td data-label="Category"><span className="category-pill">{row.category}</span></td>
                <td data-label="Type"><span className={'badge ' + (row.type === 'Income' ? 'income' : 'expense')}>{row.type}</span></td>
                <td data-label="Amount" className={'transaction-amount ' + (row.type === 'Income' ? 'success' : 'expense-text')}>{row.type === 'Income' ? '+' : '−'}{formatCurrency(row.amount)}</td>
                <td data-label="Actions"><div className="row-actions"><button className="btn-secondary" type="button" onClick={() => beginEdit(row)}>Edit</button><button className="btn-ghost danger-link" type="button" onClick={() => remove(row.id)} aria-label={'Delete ' + row.title}><Trash2 size={15} /><span>Delete</span></button></div></td>
              </tr>
            ))}</tbody></table></div>
          )}
          <div className="pager"><span>{totalItems} results <span aria-hidden="true">·</span> Page {page} of {totalPages}</span><div><button className="btn-secondary" type="button" disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)}>Previous</button><button className="btn-secondary" type="button" disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)}>Next</button></div></div>
        </section>
      </div>
    </section>
  );
}
