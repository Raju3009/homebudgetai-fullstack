import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Transaction } from '../../services/api.service';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule], templateUrl: './transactions.component.html' })
export class TransactionsComponent implements OnInit {
  private fb = inject(FormBuilder); public api = inject(ApiService);
  rows: Transaction[] = []; page = 1; totalPages = 1; editingId: number | null = null; loading = signal(false);
  filters = this.fb.nonNullable.group({ q: [''], type: [''], category: [''] });
  form = this.fb.nonNullable.group({ title: ['', Validators.required], category: ['Food', Validators.required], amount: [0, [Validators.required, Validators.min(0.01)]], type: ['Expense', Validators.required], date: [new Date().toISOString().slice(0, 10), Validators.required], notes: [''] });
  ngOnInit() { this.load(); }
  load(page = this.page) { this.loading.set(true); this.page = page; this.api.transactions({ ...this.filters.getRawValue(), page, pageSize: 8 }).subscribe(res => { this.rows = res.items; this.totalPages = Math.max(res.totalPages, 1); this.loading.set(false); }); }
  save() { if (this.form.invalid) return; const payload: any = { ...this.form.getRawValue(), date: new Date(this.form.getRawValue().date).toISOString() }; const done = () => { this.reset(); this.load(); }; this.editingId ? this.api.updateTransaction(this.editingId, payload).subscribe(done) : this.api.addTransaction(payload).subscribe(done); }
  edit(row: Transaction) { this.editingId = row.id; this.form.patchValue({ ...row, date: row.date.slice(0, 10) }); }
  remove(id: number) { this.api.deleteTransaction(id).subscribe(() => this.load()); }
  reset() { this.editingId = null; this.form.reset({ title: '', category: 'Food', amount: 0, type: 'Expense', date: new Date().toISOString().slice(0, 10), notes: '' }); }
  exportCsv() { window.open(this.api.exportUrl(), '_blank'); }
}
