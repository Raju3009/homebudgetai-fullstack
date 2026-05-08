import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Transaction } from '../../services/api.service';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule], templateUrl: './transactions.component.html' })
export class TransactionsComponent implements OnInit {
  private fb = inject(FormBuilder); public api = inject(ApiService);
  rows: Transaction[] = []; page = 1; totalPages = 1; editingId: number | null = null; loading = signal(false); message = signal(''); error = signal('');
  filters = this.fb.nonNullable.group({ q: [''], type: [''], category: [''], from: [''], to: [''] });
  form = this.fb.nonNullable.group({ title: ['', Validators.required], category: ['Food', Validators.required], amount: [0, [Validators.required, Validators.min(0.01)]], type: ['Expense', Validators.required], date: [new Date().toISOString().slice(0, 10), Validators.required], notes: [''] });
  ngOnInit() { this.load(); }
  load(page = this.page) {
    this.loading.set(true); this.error.set(''); this.page = page;
    this.api.transactions({ ...this.filters.getRawValue(), page, pageSize: 8 }).subscribe({
      next: res => { this.rows = res.items; this.totalPages = Math.max(res.totalPages, 1); this.loading.set(false); },
      error: e => { this.error.set(e.error?.message ?? 'Unable to load transactions.'); this.loading.set(false); }
    });
  }
  save() {
    if (this.form.invalid) return;
    const payload: any = { ...this.form.getRawValue(), date: new Date(this.form.getRawValue().date).toISOString() };
    const done = () => { this.message.set(this.editingId ? 'Transaction updated.' : 'Transaction added.'); this.reset(); this.load(); };
    const fail = (e: any) => this.error.set(e.error?.message ?? 'Unable to save transaction.');
    this.editingId ? this.api.updateTransaction(this.editingId, payload).subscribe({ next: done, error: fail }) : this.api.addTransaction(payload).subscribe({ next: done, error: fail });
  }
  edit(row: Transaction) { this.editingId = row.id; this.form.patchValue({ ...row, date: row.date.slice(0, 10) }); }
  remove(id: number) { if (!confirm('Delete this transaction?')) return; this.api.deleteTransaction(id).subscribe({ next: () => { this.message.set('Transaction deleted.'); this.load(); }, error: e => this.error.set(e.error?.message ?? 'Unable to delete transaction.') }); }
  reset() { this.editingId = null; this.form.reset({ title: '', category: 'Food', amount: 0, type: 'Expense', date: new Date().toISOString().slice(0, 10), notes: '' }); }
  exportCsv() {
    this.api.exportTransactions(this.filters.getRawValue()).subscribe(blob => {
      const url = URL.createObjectURL(blob); const a = document.createElement('a');
      a.href = url; a.download = 'homebudget-transactions.csv'; a.click(); URL.revokeObjectURL(url);
    });
  }
}
