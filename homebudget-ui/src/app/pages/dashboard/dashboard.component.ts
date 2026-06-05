import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';
import { AuthService } from '../../core/auth.service';
import { ApiService, DashboardSummary } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  summary?: DashboardSummary;
  loading = true;
  charts: Chart[] = [];
  viewInitialized = false;

  @ViewChild('monthlyChart') monthlyChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('categoryChart') categoryChartRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('savingsChart') savingsChartRef?: ElementRef<HTMLCanvasElement>;

  quickActions = [
    { label: 'Add Expense', path: '/app/transactions', tone: 'Log a new spend', icon: '-' },
    { label: 'Add Budget', path: '/app/budgets', tone: 'Create a guardrail', icon: '+' },
    { label: 'Generate AI Insights', path: '/app/reports', tone: 'Review recommendations', icon: 'AI' },
    { label: 'View Reports', path: '/app/reports', tone: 'Export summaries', icon: 'PDF' }
  ];

  constructor(private api: ApiService, public auth: AuthService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngAfterViewInit(): void {
    this.viewInitialized = true;
    window.setTimeout(() => this.drawCharts(), 450);
  }

  loadDashboard(): void {
    this.loading = true;
    this.api.dashboard().subscribe({
      next: response => {
        this.summary = response;
        this.loading = false;
        this.cdr.detectChanges();
        window.setTimeout(() => this.drawCharts(), 250);
      },
      error: () => {
        this.loading = false;
        this.summary = {
          balance: 3965,
          income: 7100,
          expenses: 3135,
          savingsRate: 55.8,
          monthlyTotals: [
            { month: 'Jan', income: 5200, expenses: 4100 },
            { month: 'Feb', income: 6100, expenses: 4300 },
            { month: 'Mar', income: 6400, expenses: 4700 },
            { month: 'Apr', income: 7200, expenses: 5200 },
            { month: 'May', income: 7100, expenses: 3135 }
          ],
          categoryTotals: [
            { category: 'Housing', total: 1800 },
            { category: 'Food', total: 620 },
            { category: 'Savings', total: 850 },
            { category: 'Travel', total: 420 }
          ],
          suggestions: [
            'Food spending increased 18% this month.',
            'Savings improved compared to last month.',
            'Entertainment expenses are under control.'
          ],
          recentTransactions: []
        } as DashboardSummary;
        this.cdr.detectChanges();
        window.setTimeout(() => this.drawCharts(), 250);
      }
    });
  }

  displayName(): string {
    return this.auth.user()?.fullName?.split(' ')[0] || 'Raju';
  }

  currentMonth(): string {
    return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date());
  }

  savingsAmount(): number {
    return Math.max((this.summary?.income ?? 0) - (this.summary?.expenses ?? 0), 0);
  }

  remainingBudget(): number {
    return this.summary?.balance ?? 0;
  }

  budgetHealthScore(): number {
    const income = this.summary?.income ?? 0;
    const expenses = this.summary?.expenses ?? 0;
    const savingsRate = this.bounded(this.summary?.savingsRate ?? 0);
    if (income <= 0) return 0;
    const spendingControl = this.bounded(100 - (expenses / income) * 100);
    return Math.round((savingsRate * 0.55) + (spendingControl * 0.45));
  }

  monthSummary(): string {
    const score = this.budgetHealthScore();
    if (score >= 70) return 'Healthy month with positive savings momentum.';
    if (score >= 40) return 'Stable month. Watch high-spend categories.';
    return 'Needs attention. Review expenses and budget limits.';
  }

  aiSuggestions(): string[] {
    const base = this.summary?.suggestions ?? [];
    const curated = [
      'Review your top category before adding new discretionary expenses this week.',
      'Keep one recurring transfer active so savings stay automatic after every income cycle.',
      'If expenses cross 70% of income, pause non-essential purchases and update your budget limits.',
      'Export a monthly report before salary day to compare the previous month clearly.',
      'Use notes on transactions so future AI insights can explain patterns more accurately.'
    ];
    return [...new Set([...base, ...curated])].slice(0, 6);
  }

  bounded(value: number): number {
    return Math.max(0, Math.min(100, value || 0));
  }

  trendLabel(value: number): string {
    return value >= 0 ? 'Positive trend' : 'Needs attention';
  }

  drawCharts(): void {
    if (!this.viewInitialized || !this.summary || !this.monthlyChartRef?.nativeElement || !this.categoryChartRef?.nativeElement || !this.savingsChartRef?.nativeElement) {
      return;
    }

    this.charts.forEach(chart => {
      try { chart.destroy(); } catch {}
    });
    this.charts = [];

    const months = this.summary.monthlyTotals || [];
    const categories = this.summary.categoryTotals || [];

    this.charts.push(new Chart(this.monthlyChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: months.map(item => item.month),
        datasets: [
          { label: 'Income', data: months.map(item => item.income), backgroundColor: '#0f766e', borderRadius: 12, maxBarThickness: 42 },
          { label: 'Expenses', data: months.map(item => item.expenses), backgroundColor: '#f97316', borderRadius: 12, maxBarThickness: 42 }
        ]
      },
      options: this.axisOptions()
    }));

    this.charts.push(new Chart(this.categoryChartRef.nativeElement, {
      type: 'doughnut',
      data: {
        labels: categories.map(item => item.category),
        datasets: [{
          data: categories.map(item => item.total),
          backgroundColor: ['#0f766e', '#2563eb', '#f97316', '#dc2626', '#0891b2', '#16a34a'],
          borderColor: 'rgba(255,255,255,0.9)',
          borderWidth: 3,
          hoverOffset: 14
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        animation: { animateRotate: true, duration: 1100 },
        plugins: {
          legend: { position: 'bottom', labels: { color: '#64748b', usePointStyle: true, padding: 18 } },
          tooltip: { callbacks: { label: (context: any) => `${context.label}: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(context.raw))}` } }
        }
      }
    }));

    this.charts.push(new Chart(this.savingsChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: months.map(item => item.month),
        datasets: [{
          label: 'Savings',
          data: months.map(item => Math.max(item.income - item.expenses, 0)),
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.16)',
          fill: true,
          tension: 0.42,
          pointRadius: 5,
          pointBackgroundColor: '#0f766e'
        }]
      },
      options: this.axisOptions()
    }));
  }

  axisOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1100, easing: 'easeOutQuart' },
      plugins: {
        legend: { labels: { color: '#64748b', usePointStyle: true, padding: 18 } },
        tooltip: {
          backgroundColor: '#071311',
          padding: 12,
          callbacks: { label: (context: any) => `${context.dataset.label}: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(Number(context.raw))}` }
        }
      },
      scales: {
        x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(100, 116, 139, 0.08)' } },
        y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(100, 116, 139, 0.1)' } }
      }
    };
  }

  ngOnDestroy(): void {
    this.charts.forEach(chart => {
      try { chart.destroy(); } catch {}
    });
  }
}

