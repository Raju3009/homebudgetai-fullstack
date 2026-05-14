import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Budget, Goal } from '../../services/api.service';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule], template: `
<section class="workspace premium-page">
  <form class="panel editor" [formGroup]="form" (ngSubmit)="saveBudget()">
    <div class="section-head"><div><h2>Budget management</h2><p>Create monthly category limits and overspending alerts.</p></div><span class="badge success">Live tracking</span></div>
    <label>Name<input formControlName="name" placeholder="May essentials"></label>
    <label>Category<input formControlName="category" placeholder="Food"></label>
    <div class="form-row"><label>Limit<input type="number" formControlName="limitAmount"></label><label>Alert %<input type="number" formControlName="alertThreshold"></label></div>
    <label>Month<input type="month" formControlName="month"></label>
    <div class="actions"><button class="btn-primary" [disabled]="form.invalid">Save budget</button><button type="button" class="btn-secondary" (click)="reset()">Clear</button></div>
  </form>
  <section class="page-grid">
    <article class="panel full"><div class="section-head"><div><h2>Budget health</h2><p>Progress bars update from transaction totals.</p></div></div><div class="empty-state" *ngIf="!loading() && budgets.length === 0">No budgets yet. Create one to start monitoring spend.</div></article>
    <article class="panel" *ngFor="let budget of budgets">
      <div class="section-head"><div><h2>{{ budget.name }}</h2><p>{{ budget.category }} | {{ budget.month | date:'MMM yyyy' }}</p></div><span class="badge" [class.danger]="percent(budget) >= budget.alertThreshold">{{ percent(budget) | number:'1.0-0' }}%</span></div>
      <strong>{{ budget.spentAmount | currency }} / {{ budget.limitAmount | currency }}</strong>
      <div class="progress-line"><span [style.width.%]="bounded(percent(budget))"></span></div>
      <p class="muted">{{ percent(budget) >= budget.alertThreshold ? 'Overspending alert active' : 'Within planned range' }}</p>
      <div class="actions"><button class="btn-secondary" (click)="edit(budget)">Edit</button><button class="btn-ghost error" (click)="remove(budget.id)">Delete</button></div>
    </article>
    <article class="panel full"><div class="section-head"><div><h2>Financial goals</h2><p>Portfolio-worthy goal cards for savings milestones.</p></div></div><div class="quick-grid"><div class="quick-action" *ngFor="let goal of goals"><strong>{{ goal.name }}</strong><small>{{ goal.currentAmount | currency }} of {{ goal.targetAmount | currency }}</small><div class="progress-line"><span [style.width.%]="bounded(goal.currentAmount / goal.targetAmount * 100)"></span></div></div></div></article>
  </section>
</section>` })
export class BudgetsComponent implements OnInit {
  private fb = inject(FormBuilder); private api = inject(ApiService);
  budgets: Budget[] = []; goals: Goal[] = []; loading = signal(true); editingId: number | null = null;
  form = this.fb.nonNullable.group({ name: ['', Validators.required], category: ['Food', Validators.required], limitAmount: [1000, [Validators.required, Validators.min(1)]], alertThreshold: [80, [Validators.required, Validators.min(1)]], month: [new Date().toISOString().slice(0, 7), Validators.required] });
  ngOnInit() { this.load(); }
  load() { this.loading.set(true); this.api.budgets().subscribe({ next: x => { this.budgets = x; this.loading.set(false); }, error: () => this.loading.set(false) }); this.api.goals().subscribe(x => this.goals = x); }
  percent(b: Budget) { return b.limitAmount <= 0 ? 0 : (b.spentAmount / b.limitAmount) * 100; }
  bounded(v: number) { return Math.max(0, Math.min(100, v || 0)); }
  edit(b: Budget) { this.editingId = b.id; this.form.patchValue({ ...b, month: b.month.slice(0, 7) }); }
  saveBudget() { if (this.form.invalid) return; this.api.saveBudget({ ...this.form.getRawValue(), id: this.editingId ?? undefined, month: `${this.form.getRawValue().month}-01` }).subscribe(() => { this.reset(); this.load(); }); }
  remove(id: number) { this.api.deleteBudget(id).subscribe(() => this.load()); }
  reset() { this.editingId = null; this.form.reset({ name: '', category: 'Food', limitAmount: 1000, alertThreshold: 80, month: new Date().toISOString().slice(0, 7) }); }
}
