import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService, Budget, Goal } from '../../services/api.service';
import { ToastService } from '../../shared/toast.service';

type BudgetPeriod = 'Monthly' | 'Weekly' | 'Yearly';
type BudgetSort = 'highest' | 'lowest' | 'remaining';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
<section class="workspace premium-page budgets-page">
  <form class="panel editor budget-editor" [formGroup]="form" (ngSubmit)="saveBudget()" novalidate>
    <div class="section-head">
      <div><h2>{{ editingId ? 'Edit budget' : 'Create budget' }}</h2><p>Set a spending guardrail and alert threshold.</p></div>
      <span class="badge success">Live tracking</span>
    </div>

    <label>Budget Name<input formControlName="name" placeholder="Groceries"></label>
    <label>Category<input formControlName="category" placeholder="Food"></label>
    <div class="form-row">
      <label>Allocated Amount<input type="number" formControlName="limitAmount" min="1"></label>
      <label>Alert Threshold %<input type="number" formControlName="alertThreshold" min="1" max="100"></label>
    </div>
    <label>Month<input type="month" formControlName="month"></label>

    <div class="actions">
      <button class="btn-primary" type="submit" [disabled]="form.invalid || saving()">{{ saving() ? 'Saving...' : 'Save budget' }}</button>
      <button type="button" class="btn-secondary" (click)="reset()">Clear</button>
    </div>
  </form>

  <section class="budget-content">
    <section class="panel full budget-toolbar">
      <div class="section-head">
        <div><h2>Budget health</h2><p>Simple cards show allocated, spent, remaining, and risk level.</p></div>
      </div>
      <div class="budget-controls">
        <div class="segmented-control" aria-label="Budget period filter">
          <button type="button" *ngFor="let item of periods" [class.active]="period() === item" (click)="period.set(item)">{{ item }}</button>
        </div>
        <label class="sort-control">
          <span>Sort</span>
          <select [value]="sort()" (change)="setSort($any($event.target).value)">
            <option value="highest">Highest Spending</option>
            <option value="lowest">Lowest Spending</option>
            <option value="remaining">Remaining Budget</option>
          </select>
        </label>
      </div>
    </section>

    <section class="budget-grid" *ngIf="!loading() && sortedBudgets().length > 0; else budgetState">
      <article class="panel budget-card" *ngFor="let budget of sortedBudgets()" [class.safe]="statusClass(budget) === 'safe'" [class.warning]="statusClass(budget) === 'warning'" [class.exceeded]="statusClass(budget) === 'exceeded'">
        <div class="budget-card-head">
          <div>
            <small>{{ budget.category }} | {{ budget.month | date:'MMM yyyy' }} | {{ period() }}</small>
            <h2>{{ budget.name }}</h2>
          </div>
          <span class="budget-status">{{ statusLabel(budget) }}</span>
        </div>

        <div class="budget-amounts">
          <span><small>Allocated</small><strong>{{ budget.limitAmount | currency:'INR' }}</strong></span>
          <span><small>Spent</small><strong>{{ budget.spentAmount | currency:'INR' }}</strong></span>
          <span><small>Remaining</small><strong [class.error]="remaining(budget) < 0">{{ remaining(budget) | currency:'INR' }}</strong></span>
        </div>

        <div class="progress-line budget-progress"><span [style.width.%]="bounded(percent(budget))"></span></div>
        <p class="muted">{{ percent(budget) | number:'1.0-0' }}% used. {{ remaining(budget) < 0 ? 'Budget exceeded. Reduce or reallocate spending.' : 'Remaining balance is still available.' }}</p>

        <div class="actions">
          <button class="btn-secondary" type="button" (click)="edit(budget)">Edit</button>
          <button class="btn-ghost error" type="button" (click)="remove(budget.id)">Delete</button>
        </div>
      </article>
    </section>

    <ng-template #budgetState>
      <article class="panel full empty-state budget-empty" *ngIf="!loading(); else budgetLoading">
        <div class="empty-illustration"><span></span><span></span><span></span></div>
        <strong>No budgets yet</strong>
        <p>Create one to start monitoring spending by category.</p>
      </article>
    </ng-template>

    <ng-template #budgetLoading>
      <section class="budget-grid"><article class="panel skeleton" *ngFor="let item of [].constructor(3)"></article></section>
    </ng-template>

    <article class="panel full goals-panel">
      <div class="section-head"><div><h2>Financial goals</h2><p>Track savings milestones alongside budgets.</p></div></div>
      <div class="quick-grid">
        <div class="quick-action goal-card" *ngFor="let goal of goals">
          <strong>{{ goal.name }}</strong>
          <small>{{ goal.currentAmount | currency:'INR' }} of {{ goal.targetAmount | currency:'INR' }}</small>
          <div class="progress-line"><span [style.width.%]="bounded(goal.currentAmount / goal.targetAmount * 100)"></span></div>
        </div>
      </div>
    </article>
  </section>
</section>
`,
  styles: [`
    :host { display: block; }
    .budgets-page { align-items: start; }
    .budget-content { display: grid; gap: 1rem; }
    .budget-toolbar { display: grid; gap: 1rem; }
    .budget-controls { display: flex; align-items: end; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
    .segmented-control { display: inline-flex; padding: .35rem; border: 1px solid var(--line); border-radius: 16px; background: rgba(255,255,255,.52); }
    .segmented-control button { min-height: 40px; border-radius: 12px; padding: .55rem .85rem; color: var(--muted); background: transparent; font-weight: 900; }
    .segmented-control button.active { color: #fff; background: linear-gradient(135deg, var(--brand), var(--brand-2)); box-shadow: 0 12px 28px rgba(15,118,110,.18); }
    .sort-control { min-width: 230px; }
    .sort-control span { color: var(--muted); font-size: .78rem; text-transform: uppercase; }
    .budget-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }
    .budget-card { display: grid; gap: 1rem; overflow: hidden; transition: transform .22s ease, box-shadow .22s ease; }
    .budget-card:hover { transform: translateY(-5px); box-shadow: 0 28px 80px rgba(15,35,31,.16); }
    .budget-card::before { content: ''; display: block; height: 5px; margin: -1.2rem -1.2rem 0; background: #16a34a; }
    .budget-card.warning::before { background: #d97706; }
    .budget-card.exceeded::before { background: #dc2626; }
    .budget-card-head { display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start; }
    .budget-card-head h2 { margin: .2rem 0 0; }
    .budget-card-head small { color: var(--muted); font-weight: 800; }
    .budget-status { border-radius: 999px; padding: .32rem .62rem; font-size: .75rem; font-weight: 900; color: #15803d; background: rgba(22,163,74,.12); }
    .warning .budget-status { color: #9a3412; background: rgba(217,119,6,.14); }
    .exceeded .budget-status { color: #b91c1c; background: rgba(220,38,38,.12); }
    .budget-amounts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .65rem; }
    .budget-amounts span { display: grid; gap: .25rem; border: 1px solid var(--line); border-radius: 16px; padding: .75rem; background: rgba(255,255,255,.48); }
    .budget-amounts small { font-weight: 800; }
    .budget-amounts strong { overflow-wrap: anywhere; }
    .budget-progress span { background: #16a34a; }
    .warning .budget-progress span { background: #d97706; }
    .exceeded .budget-progress span { background: #dc2626; }
    .budget-empty { display: grid; place-items: center; gap: .6rem; min-height: 280px; }
    .budget-empty p, .budget-empty strong { margin: 0; }
    .empty-illustration { display: flex; align-items: end; gap: .5rem; min-height: 80px; }
    .empty-illustration span { width: 34px; border-radius: 12px 12px 6px 6px; background: linear-gradient(180deg, var(--brand), var(--brand-2)); }
    .empty-illustration span:nth-child(1) { height: 44px; }
    .empty-illustration span:nth-child(2) { height: 72px; }
    .empty-illustration span:nth-child(3) { height: 56px; background: linear-gradient(180deg, #f59e0b, #16a34a); }
    .goal-card { min-height: 132px; }
    @media (max-width: 1180px) { .budget-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
    @media (max-width: 720px) { .budget-grid, .budget-amounts { grid-template-columns: 1fr; } .budget-controls, .sort-control, .segmented-control { width: 100%; } .segmented-control { display: grid; grid-template-columns: repeat(3, 1fr); } }
  `]
})
export class BudgetsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  readonly periods: BudgetPeriod[] = ['Monthly', 'Weekly', 'Yearly'];
  budgets: Budget[] = [];
  goals: Goal[] = [];
  loading = signal(true);
  saving = signal(false);
  period = signal<BudgetPeriod>('Monthly');
  sort = signal<BudgetSort>('highest');
  editingId: number | null = null;

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    category: ['Food', Validators.required],
    limitAmount: [1000, [Validators.required, Validators.min(1)]],
    alertThreshold: [80, [Validators.required, Validators.min(1), Validators.max(100)]],
    month: [new Date().toISOString().slice(0, 7), Validators.required]
  });

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.budgets().subscribe({
      next: budgets => { this.budgets = budgets; this.loading.set(false); },
      error: () => { this.loading.set(false); this.toast.error('Budgets could not be loaded.'); }
    });
    this.api.goals().subscribe(goals => this.goals = goals);
  }

  setSort(value: BudgetSort): void { this.sort.set(value); }

  sortedBudgets(): Budget[] {
    const items = [...this.budgets];
    if (this.sort() === 'lowest') return items.sort((a, b) => a.spentAmount - b.spentAmount);
    if (this.sort() === 'remaining') return items.sort((a, b) => this.remaining(b) - this.remaining(a));
    return items.sort((a, b) => b.spentAmount - a.spentAmount);
  }

  percent(budget: Budget): number { return budget.limitAmount <= 0 ? 0 : (budget.spentAmount / budget.limitAmount) * 100; }
  bounded(value: number): number { return Math.max(0, Math.min(100, value || 0)); }
  remaining(budget: Budget): number { return budget.limitAmount - budget.spentAmount; }

  statusClass(budget: Budget): 'safe' | 'warning' | 'exceeded' {
    const percent = this.percent(budget);
    if (percent >= 100) return 'exceeded';
    if (percent >= budget.alertThreshold || percent >= 75) return 'warning';
    return 'safe';
  }

  statusLabel(budget: Budget): string {
    const status = this.statusClass(budget);
    return status === 'safe' ? 'Safe' : status === 'warning' ? 'Warning' : 'Exceeded';
  }

  edit(budget: Budget): void {
    this.editingId = budget.id;
    this.form.patchValue({ ...budget, month: budget.month.slice(0, 7) });
  }

  saveBudget(): void {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      this.toast.warning('Please complete the budget form.');
      return;
    }

    const value = this.form.getRawValue();
    this.saving.set(true);
    this.api.saveBudget({ ...value, id: this.editingId ?? undefined, month: `${value.month}-01` }).subscribe({
      next: () => {
        this.toast.success(this.editingId ? 'Budget updated.' : 'Budget created.');
        this.saving.set(false);
        this.reset();
        this.load();
      },
      error: () => { this.toast.error('Budget could not be saved.'); this.saving.set(false); }
    });
  }

  remove(id: number): void {
    this.api.deleteBudget(id).subscribe({
      next: () => { this.toast.success('Budget deleted.'); this.load(); },
      error: () => this.toast.error('Budget could not be deleted.')
    });
  }

  reset(): void {
    this.editingId = null;
    this.form.reset({ name: '', category: 'Food', limitAmount: 1000, alertThreshold: 80, month: new Date().toISOString().slice(0, 7) });
  }
}
