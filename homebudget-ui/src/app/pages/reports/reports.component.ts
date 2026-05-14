import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { ApiService, ReportSummary } from '../../services/api.service';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule], template: `
<section class="premium-page page-grid">
  <section class="panel full"><div class="section-head"><div><h2>Reports</h2><p>Monthly, yearly, category, printable, PDF, and CSV financial summaries.</p></div><div class="actions"><button class="btn-secondary" (click)="load()">Refresh</button><button class="btn-secondary" (click)="exportCsv()">CSV</button><button class="btn-primary" (click)="exportPdf()">PDF</button></div></div><form class="filters" [formGroup]="filters"><select formControlName="period"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select><input type="month" formControlName="month"><input type="number" formControlName="year"></form></section>
  <section #printArea class="panel full report-print" *ngIf="report; else loadingTpl"><div class="section-head"><div><h2>Financial summary</h2><p>Generated {{ report.generatedAt | date:'medium' }}</p></div><span class="badge success">{{ report.savingsRate | number:'1.0-1' }}% savings</span></div><div class="quick-grid"><div class="quick-action"><strong>{{ report.income | currency }}</strong><small>Income</small></div><div class="quick-action"><strong>{{ report.expenses | currency }}</strong><small>Expenses</small></div><div class="quick-action"><strong>{{ report.balance | currency }}</strong><small>Balance</small></div></div><h3>Category report</h3><div class="category-row" *ngFor="let item of report.categories"><span>{{ item.category }}</span><strong>{{ item.total | currency }}</strong></div><h3>AI summary</h3><div class="suggestion" *ngFor="let item of report.insights">{{ item }}</div></section>
  <ng-template #loadingTpl><section class="panel full skeleton" style="min-height:360px"></section></ng-template>
</section>` })
export class ReportsComponent implements OnInit {
  private fb = inject(FormBuilder); private api = inject(ApiService);
  @ViewChild('printArea') printArea?: ElementRef<HTMLElement>;
  report?: ReportSummary; loading = signal(false);
  filters = this.fb.nonNullable.group({ period: ['monthly'], month: [new Date().toISOString().slice(0, 7)], year: [new Date().getFullYear()] });
  ngOnInit() { this.load(); }
  params() { const v = this.filters.getRawValue(); return { period: v.period, month: v.month, year: v.year }; }
  load() { this.loading.set(true); this.api.report(this.params()).subscribe({ next: x => { this.report = x; this.loading.set(false); }, error: () => this.loading.set(false) }); }
  exportCsv() { this.api.exportReportCsv(this.params()).subscribe(blob => { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'homebudget-report.csv'; a.click(); URL.revokeObjectURL(url); }); }
  async exportPdf() { if (!this.printArea) return; const canvas = await html2canvas(this.printArea.nativeElement, { backgroundColor: '#ffffff', scale: 2 }); const pdf = new jsPDF('p', 'mm', 'a4'); const width = 190; const height = canvas.height * width / canvas.width; pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, width, height); pdf.save('homebudget-report.pdf'); }
}
