import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { ApiService, ReportSummary } from '../../services/api.service';
import { ToastService } from '../../shared/toast.service';

type Priority = 'Low' | 'Medium' | 'High';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<section class="premium-page reports-page page-grid">
  <section class="panel full reports-hero">
    <div class="section-head">
      <div><h2>AI Suggestions</h2><p>Intelligent spending analysis, recommendations, exports, and finance summaries.</p></div>
      <div class="actions">
        <button class="btn-secondary" type="button" (click)="load()">Refresh</button>
        <button class="btn-primary generate-btn" type="button" [disabled]="generating()" (click)="generateInsights()"><span *ngIf="generating()" class="button-spinner"></span>{{ generating() ? 'Generating...' : 'Generate Insight' }}</button>
        <button class="btn-secondary" type="button" (click)="exportCsv()">CSV</button>
        <button class="btn-secondary" type="button" (click)="exportPdf()">PDF</button>
      </div>
    </div>
    <form class="filters" [formGroup]="filters">
      <select formControlName="period"><option value="monthly">Monthly</option><option value="yearly">Yearly</option></select>
      <input type="month" formControlName="month">
      <input type="number" formControlName="year">
    </form>
  </section>

  <section #printArea class="panel full report-print" *ngIf="report; else loadingTpl">
    <div class="section-head">
      <div><h2>Financial summary</h2><p>Generated {{ report.generatedAt | date:'medium' }}</p></div>
      <span class="badge success">{{ report.savingsRate | number:'1.0-1' }}% savings</span>
    </div>

    <div class="quick-grid report-metrics">
      <div class="quick-action"><strong>{{ report.income | currency:'INR' }}</strong><small>Total Income</small></div>
      <div class="quick-action"><strong>{{ report.expenses | currency:'INR' }}</strong><small>Total Expenses</small></div>
      <div class="quick-action"><strong>{{ report.balance | currency:'INR' }}</strong><small>Remaining Budget</small></div>
      <div class="quick-action"><strong>{{ report.savingsRate | number:'1.0-1' }}%</strong><small>Savings Rate</small></div>
    </div>

    <div class="insight-grid">
      <article class="insight-card" *ngFor="let insight of insightCards(); let index = index" [class.low]="insight.priority === 'Low'" [class.medium]="insight.priority === 'Medium'" [class.high]="insight.priority === 'High'">
        <div class="insight-head">
          <span>AI</span>
          <strong>{{ insight.title }}</strong>
          <small>{{ insight.priority }} Priority</small>
        </div>
        <p>{{ insight.text }}</p>
      </article>
    </div>

    <div class="report-grid">
      <section class="report-block">
        <h3>Category Spend</h3>
        <div class="category-bars" *ngIf="report.categories.length > 0; else noCategories">
          <div class="category-bar" *ngFor="let item of report.categories">
            <div><span>{{ item.category }}</span><strong>{{ item.total | currency:'INR' }}</strong></div>
            <i><b [style.width.%]="categoryPercent(item.total)"></b></i>
          </div>
        </div>
        <ng-template #noCategories><div class="empty-state">Add expenses to generate category charts.</div></ng-template>
      </section>

      <section class="report-block recommendations">
        <h3>Recommendations</h3>
        <div class="recommendation" *ngFor="let item of recommendations()">{{ item }}</div>
      </section>
    </div>
  </section>

  <ng-template #loadingTpl><section class="panel full skeleton" style="min-height:360px"></section></ng-template>
</section>
`,
  styles: [`
    :host { display: block; }
    .reports-page { align-items: start; }
    .reports-hero { background: linear-gradient(135deg, rgba(15,118,110,.13), rgba(37,99,235,.08)), var(--surface); }
    .reports-hero h2 { font-size: clamp(1.8rem, 4vw, 3rem); }
    .generate-btn { min-width: 178px; }
    .button-spinner { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 999px; animation: spin .8s linear infinite; }
    .report-print { display: grid; gap: 1.2rem; }
    .report-metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .insight-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .insight-card { display: grid; gap: .85rem; border: 1px solid var(--line); border-radius: 20px; padding: 1rem; background: rgba(255,255,255,.62); box-shadow: var(--soft-shadow); transition: transform .22s ease, box-shadow .22s ease; }
    .insight-card:hover { transform: translateY(-4px); box-shadow: 0 22px 70px rgba(15,35,31,.14); }
    .insight-card.high { border-top: 5px solid #dc2626; }
    .insight-card.medium { border-top: 5px solid #d97706; }
    .insight-card.low { border-top: 5px solid #16a34a; }
    .insight-head { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: .45rem .65rem; align-items: center; }
    .insight-head span { grid-row: span 2; width: 42px; height: 42px; display: grid; place-items: center; border-radius: 14px; color: #fff; background: linear-gradient(135deg, var(--brand), var(--brand-2)); font-weight: 900; }
    .insight-head small { color: var(--muted); font-weight: 900; }
    .insight-card p { margin: 0; color: var(--muted); line-height: 1.6; }
    .report-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(320px, .78fr); gap: 1rem; }
    .report-block { border: 1px solid var(--line); border-radius: 20px; padding: 1rem; background: rgba(255,255,255,.48); }
    .report-block h3 { margin: 0 0 1rem; }
    .category-bars { display: grid; gap: .85rem; }
    .category-bar { display: grid; gap: .4rem; }
    .category-bar div { display: flex; justify-content: space-between; gap: 1rem; color: var(--text); font-weight: 800; }
    .category-bar i { height: 12px; border-radius: 999px; overflow: hidden; background: rgba(148,163,184,.2); }
    .category-bar b { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--brand), var(--brand-2), var(--warning)); animation: growBar .7s ease both; }
    .recommendations { display: grid; gap: .75rem; }
    .recommendation { border: 1px solid var(--line); border-radius: 16px; padding: .85rem; color: var(--muted); background: rgba(255,255,255,.56); font-weight: 700; }
    @keyframes growBar { from { width: 0; } }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (max-width: 1180px) { .insight-grid, .report-grid { grid-template-columns: 1fr; } .report-metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 640px) { .report-metrics { grid-template-columns: 1fr; } .reports-hero .actions, .reports-hero button { width: 100%; } }
  `]
})
export class ReportsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  @ViewChild('printArea') printArea?: ElementRef<HTMLElement>;
  report?: ReportSummary;
  loading = signal(false);
  generating = signal(false);

  filters = this.fb.nonNullable.group({
    period: ['monthly'],
    month: [new Date().toISOString().slice(0, 7)],
    year: [new Date().getFullYear()]
  });

  ngOnInit(): void { this.load(); }

  params() {
    const value = this.filters.getRawValue();
    return { period: value.period, month: value.month, year: value.year };
  }

  load(): void {
    this.loading.set(true);
    this.api.report(this.params()).subscribe({
      next: report => { this.report = report; this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Report could not be loaded.'); }
    });
  }

  generateInsights(): void {
    this.generating.set(true);
    this.toast.info('Generating fresh AI insights.');
    this.api.report(this.params()).subscribe({
      next: report => {
        window.setTimeout(() => {
          this.report = report;
          this.generating.set(false);
          this.toast.success('AI insights generated.');
        }, 550);
      },
      error: () => { this.generating.set(false); this.toast.error('AI insights could not be generated.'); }
    });
  }

  insightCards(): { title: string; text: string; priority: Priority }[] {
    const insights = this.report?.insights?.length ? this.report.insights : [
      'You spent 25% more on food this month. Review grocery and dining purchases.',
      'Your entertainment budget is exceeding planned limits. Reduce discretionary spend this week.',
      'You could save INR 5,000 monthly by reducing recurring expenses.'
    ];

    return insights.slice(0, 6).map((text, index) => ({
      title: `Recommendation ${index + 1}`,
      text,
      priority: this.priorityFor(text)
    }));
  }

  recommendations(): string[] {
    return [
      'Move surplus balance into emergency savings before adding new subscriptions.',
      'Set alert thresholds near 75% for flexible categories like food and entertainment.',
      'Export reports monthly to compare planned budgets with actual spending.'
    ];
  }

  categoryPercent(total: number): number {
    const max = Math.max(...(this.report?.categories ?? []).map(item => item.total), 1);
    return Math.max(8, Math.min(100, (total / max) * 100));
  }

  exportCsv(): void {
    this.api.exportReportCsv(this.params()).subscribe(blob => {
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'homebudget-report.csv';
      anchor.click();
      URL.revokeObjectURL(url);
      this.toast.success('CSV report exported.');
    });
  }

  async exportPdf(): Promise<void> {
    if (!this.printArea) return;
    const canvas = await html2canvas(this.printArea.nativeElement, { backgroundColor: '#ffffff', scale: 2 });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const width = 190;
    const height = canvas.height * width / canvas.width;
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, width, height);
    pdf.save('homebudget-report.pdf');
    this.toast.success('PDF report exported.');
  }

  private priorityFor(text: string): Priority {
    const normalized = text.toLowerCase();
    if (normalized.includes('exceed') || normalized.includes('more') || normalized.includes('reduce')) return 'High';
    if (normalized.includes('review') || normalized.includes('could') || normalized.includes('may')) return 'Medium';
    return 'Low';
  }
}
