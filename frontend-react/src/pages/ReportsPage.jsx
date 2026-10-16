import { useCallback, useEffect, useRef, useState } from 'react';
import { financeApi } from '../api/finance';
import { apiErrorMessage } from '../api/client';
import { EmptyState, PageError, PageLoading } from '../components/PageState';
import PageHeader from '../components/PageHeader';
import { formatCurrency, formatDate } from '../utils/format';
import { useToast } from '../context/ToastContext';

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function ReportsPage() {
  const toast = useToast();
  const printRef = useRef(null);
  const [filters, setFilters] = useState({ period: 'monthly', month: currentMonth(), year: new Date().getFullYear() });
  const [draft, setDraft] = useState(filters);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  const load = useCallback(async (selected = filters) => {
    setLoading(true);
    setError('');
    try {
      const params = selected.period === 'yearly'
        ? { period: selected.period, year: Number(selected.year) }
        : { period: selected.period, month: selected.month };
      const { data } = await financeApi.report(params);
      setReport(data);
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Report data could not be loaded.'));
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    // The effect starts an external data request; the loader owns its loading state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load(filters);
  }, [filters, load]);

  function updateDraft(event) { setDraft((current) => ({ ...current, [event.target.name]: event.target.value })); }

  function applyFilters(event) {
    event.preventDefault();
    setFilters(draft);
  }

  async function exportCsv() {
    setExporting(true);
    try {
      const params = filters.period === 'yearly' ? { period: filters.period, year: Number(filters.year) } : { period: filters.period, month: filters.month };
      const { data } = await financeApi.exportReport(params);
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'homebudget-report.csv';
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      toast.success('CSV report downloaded.');
    } catch (requestError) {
      toast.error(apiErrorMessage(requestError, 'CSV report export failed.'));
    } finally {
      setExporting(false);
    }
  }

  async function exportPdf() {
    if (!printRef.current) return;
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
      const canvas = await html2canvas(printRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const pageWidth = pdf.internal.pageSize.getWidth() - margin * 2;
      const pageHeight = pdf.internal.pageSize.getHeight() - margin * 2;
      const sourcePageHeight = Math.floor(canvas.width * pageHeight / pageWidth);
      const pageCount = Math.ceil(canvas.height / sourcePageHeight);
      for (let page = 0; page < pageCount; page += 1) {
        if (page > 0) pdf.addPage();
        const slice = document.createElement('canvas');
        slice.width = canvas.width;
        slice.height = Math.min(sourcePageHeight, canvas.height - page * sourcePageHeight);
        const context = slice.getContext('2d');
        context.drawImage(canvas, 0, page * sourcePageHeight, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
        const renderedHeight = slice.height * pageWidth / slice.width;
        pdf.addImage(slice.toDataURL('image/png'), 'PNG', margin, margin, pageWidth, renderedHeight);
      }
      pdf.save('homebudget-report.pdf');
      toast.success('PDF report downloaded.');
    } catch (requestError) {
      toast.error(apiErrorMessage(requestError, 'PDF report export failed.'));
    } finally {
      setExporting(false);
    }
  }

  if (loading && !report) return <PageLoading label="Loading your financial report…" />;
  if (error && !report) return <PageError message={error} onRetry={() => load(filters)} />;

  const categories = report?.categories || [];
  const insights = report?.insights || [];
  const largestCategory = Math.max(1, ...categories.map((item) => Number(item.total)));

  return (
    <section className="premium-page reports-page page-grid">
      <PageHeader eyebrow="Insights" title="Reports" description="Explore your recorded activity and export a useful summary." />
      <section className="panel full reports-hero"><div className="section-head"><div><h2>Report period</h2><p>Choose a month or year to review.</p></div><div className="actions"><button className="btn-secondary" type="button" onClick={() => load(filters)} disabled={loading}>Refresh insights</button><button className="btn-secondary" type="button" onClick={exportCsv} disabled={exporting}>CSV</button><button className="btn-primary" type="button" onClick={exportPdf} disabled={exporting || !report}>{exporting ? 'Preparing…' : 'PDF'}</button></div></div>
        <form className="filters reports-filters" onSubmit={applyFilters}><label>Period<select name="period" value={draft.period} onChange={updateDraft}><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select></label>{draft.period === 'monthly' ? <label>Month<input name="month" type="month" required value={draft.month} onChange={updateDraft} /></label> : <label>Year<input name="year" type="number" min="2000" max="2100" required value={draft.year} onChange={updateDraft} /></label>}<button className="btn-secondary" type="submit" disabled={loading}>Apply</button></form>
      </section>

      {error && <div className="panel full inline-error" role="alert">{error}<button className="btn-secondary" type="button" onClick={() => load(filters)}>Try again</button></div>}

      {report && <section className="panel full report-print" ref={printRef}>
        <div className="section-head"><div><h2>Financial summary</h2><p>Generated {formatDate(report.generatedAt, { dateStyle: 'medium', timeStyle: 'short' })}</p></div><span className="badge success">{Number(report.savingsRate || 0).toFixed(1)}% savings rate</span></div>
        <div className="quick-grid report-metrics"><div className="quick-action"><strong>{formatCurrency(report.income)}</strong><small>Total income</small></div><div className="quick-action"><strong>{formatCurrency(report.expenses)}</strong><small>Total expenses</small></div><div className="quick-action"><strong>{formatCurrency(report.balance)}</strong><small>Net balance</small></div><div className="quick-action"><strong>{Number(report.savingsRate || 0).toFixed(1)}%</strong><small>Savings rate</small></div></div>
        <div className="insight-grid">{insights.map((text, index) => <article className="insight-card" key={`${index}-${text}`}><div className="insight-head"><span>AI</span><strong>Suggestion {index + 1}</strong><small>From API</small></div><p>{text}</p></article>)}{insights.length === 0 && <EmptyState>No suggestions were returned for this period.</EmptyState>}</div>
        <div className="report-grid"><section className="report-block"><h3>Category spend</h3>{categories.length ? <div className="category-bars">{categories.map((item) => <div className="category-bar" key={item.category}><div><span>{item.category}</span><strong>{formatCurrency(item.total)}</strong></div><i><b style={{ width: `${Math.max(3, Number(item.total) / largestCategory * 100)}%` }} /></i></div>)}</div> : <EmptyState>Add expenses to see category totals.</EmptyState>}</section>
          <section className="report-block recommendations"><h3>Monthly totals</h3>{(report.months || []).length ? report.months.map((item) => <div className="recommendation month-total" key={item.month}><strong>{item.month}</strong><span>Income {formatCurrency(item.income)}</span><span>Expenses {formatCurrency(item.expenses)}</span></div>) : <EmptyState>No monthly transaction data for this period.</EmptyState>}</section></div>
      </section>}
    </section>
  );
}
