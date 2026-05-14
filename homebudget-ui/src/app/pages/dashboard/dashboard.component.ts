import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';
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
  viewReady = false;
  monthlyChartRef = viewChild<ElementRef<HTMLCanvasElement>>('monthlyChart');
  categoryChartRef = viewChild<ElementRef<HTMLCanvasElement>>('categoryChart');
  savingsChartRef = viewChild<ElementRef<HTMLCanvasElement>>('savingsChart');

  quickActions = [
    { label: 'Add Income', path: '/app/transactions', tone: 'Income stream' },
    { label: 'Add Expense', path: '/app/transactions', tone: 'Track outflow' },
    { label: 'Create Budget', path: '/app/budgets', tone: 'Set guardrail' },
    { label: 'Export Report', path: '/app/reports', tone: 'Share summary' },
    { label: 'AI Insights', path: '/app/reports', tone: 'Review signals' }
  ];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.dashboard().subscribe({
      next: response => { this.summary = response; this.loading = false; this.drawCharts(); },
      error: () => { this.loading = false; }
    });
  }

  ngAfterViewInit() { this.viewReady = true; this.drawCharts(); }

  bounded(value: number) { return Math.max(0, Math.min(100, value || 0)); }
  trendLabel(value: number) { return value >= 0 ? 'Positive trend' : 'Needs attention'; }

  drawCharts() {
    if (!this.summary || !this.viewReady || !this.monthlyChartRef() || !this.categoryChartRef() || !this.savingsChartRef()) return;
    this.charts.forEach(chart => chart.destroy());
    this.charts = [];

    const months = this.summary.monthlyTotals.length ? this.summary.monthlyTotals : [
      { month: 'Jan', income: 5200, expenses: 4100 }, { month: 'Feb', income: 6100, expenses: 4300 }, { month: 'Mar', income: 6400, expenses: 4700 }
    ];
    const categories = this.summary.categoryTotals.length ? this.summary.categoryTotals : [
      { category: 'Housing', total: 1800 }, { category: 'Food', total: 620 }, { category: 'Savings', total: 850 }, { category: 'Travel', total: 420 }
    ];

    this.charts.push(new Chart(this.monthlyChartRef()!.nativeElement, {
      type: 'bar',
      data: {
        labels: months.map(item => item.month),
        datasets: [
          { label: 'Income', data: months.map(item => item.income), backgroundColor: '#4f46e5', borderRadius: 12, borderSkipped: false },
          { label: 'Expenses', data: months.map(item => item.expenses), backgroundColor: '#10b981', borderRadius: 12, borderSkipped: false }
        ]
      },
      options: this.axisOptions()
    }));

    this.charts.push(new Chart(this.categoryChartRef()!.nativeElement, {
      type: 'doughnut',
      data: { labels: categories.map(item => item.category), datasets: [{ data: categories.map(item => item.total), backgroundColor: ['#4f46e5', '#7c3aed', '#06b6d4', '#10b981', '#ec4899', '#f59e0b'], borderWidth: 0, hoverOffset: 12 }] },
      options: { responsive: true, maintainAspectRatio: false, cutout: '66%', animation: { duration: 900 }, plugins: { legend: { position: 'bottom', labels: { color: '#667085', usePointStyle: true, padding: 18 } } } }
    }));

    this.charts.push(new Chart(this.savingsChartRef()!.nativeElement, {
      type: 'line',
      data: { labels: months.map(item => item.month), datasets: [{ label: 'Savings', data: months.map(item => Math.max(item.income - item.expenses, 0)), borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, .16)', fill: true, tension: .42, pointRadius: 4 }] },
      options: this.axisOptions()
    }));
  }

  axisOptions(): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 900, easing: 'easeOutQuart' },
      plugins: { legend: { labels: { color: '#667085', usePointStyle: true } }, tooltip: { intersect: false, mode: 'index' } },
      scales: { x: { grid: { display: false }, ticks: { color: '#667085' } }, y: { grid: { color: 'rgba(148, 163, 184, .16)' }, ticks: { color: '#667085' } } }
    };
  }

  ngOnDestroy() { this.charts.forEach(chart => chart.destroy()); }
}
