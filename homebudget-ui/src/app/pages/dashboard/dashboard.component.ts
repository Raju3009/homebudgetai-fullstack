import { CommonModule } from '@angular/common';

import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';

import { RouterLink } from '@angular/router';

import Chart from 'chart.js/auto';

import {
  ApiService,
  DashboardSummary
} from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent
  implements OnInit, AfterViewInit, OnDestroy {

  summary?: DashboardSummary;

  loading = true;

  charts: Chart[] = [];

  viewInitialized = false;

  @ViewChild('monthlyChart')
  monthlyChartRef?: ElementRef<HTMLCanvasElement>;

  @ViewChild('categoryChart')
  categoryChartRef?: ElementRef<HTMLCanvasElement>;

  @ViewChild('savingsChart')
  savingsChartRef?: ElementRef<HTMLCanvasElement>;

  quickActions = [
    {
      label: 'Add Income',
      path: '/app/transactions',
      tone: 'Income stream'
    },
    {
      label: 'Add Expense',
      path: '/app/transactions',
      tone: 'Track outflow'
    },
    {
      label: 'Create Budget',
      path: '/app/budgets',
      tone: 'Set guardrail'
    },
    {
      label: 'Export Report',
      path: '/app/reports',
      tone: 'Share summary'
    },
    {
      label: 'AI Insights',
      path: '/app/reports',
      tone: 'Review signals'
    }
  ];

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {

    this.loadDashboard();
  }

  ngAfterViewInit(): void {

    this.viewInitialized = true;

    setTimeout(() => {

      this.drawCharts();

    }, 500);
  }

  loadDashboard(): void {

    this.api.dashboard().subscribe({

      next: (response) => {

        this.summary = response;

        this.loading = false;

        this.cdr.detectChanges();

        setTimeout(() => {

          this.drawCharts();

        }, 500);
      },

      error: () => {

        this.loading = false;

        // fallback demo data

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

        setTimeout(() => {

          this.drawCharts();

        }, 500);
      }
    });
  }

  bounded(value: number): number {

    return Math.max(
      0,
      Math.min(100, value || 0)
    );
  }

  trendLabel(value: number): string {

    return value >= 0
      ? 'Positive trend'
      : 'Needs attention';
  }

  drawCharts(): void {

    if (
      !this.viewInitialized ||
      !this.summary ||
      !this.monthlyChartRef?.nativeElement ||
      !this.categoryChartRef?.nativeElement ||
      !this.savingsChartRef?.nativeElement
    ) {
      return;
    }

    // destroy old charts safely

    this.charts.forEach(chart => {

      try {

        chart.destroy();

      } catch {}
    });

    this.charts = [];

    const months =
      this.summary.monthlyTotals || [];

    const categories =
      this.summary.categoryTotals || [];

    // Monthly Income vs Expense Chart

    const monthlyChart = new Chart(
      this.monthlyChartRef.nativeElement,
      {
        type: 'bar',

        data: {

          labels: months.map(
            item => item.month
          ),

          datasets: [
            {
              label: 'Income',

              data: months.map(
                item => item.income
              ),

              backgroundColor: '#0f766e',

              borderRadius: 12
            },
            {
              label: 'Expenses',

              data: months.map(
                item => item.expenses
              ),

              backgroundColor: '#dc2626',

              borderRadius: 12
            }
          ]
        },

        options: this.axisOptions()
      }
    );

    this.charts.push(monthlyChart);

    // Category Doughnut Chart

    const categoryChart = new Chart(
      this.categoryChartRef.nativeElement,
      {
        type: 'doughnut',

        data: {

          labels: categories.map(
            item => item.category
          ),

          datasets: [
            {
              data: categories.map(
                item => item.total
              ),

              backgroundColor: [
                '#0f766e',
                '#16a34a',
                '#d97706',
                '#dc2626',
                '#2563eb',
                '#0891b2'
              ],

              borderWidth: 0,

              hoverOffset: 14
            }
          ]
        },

        options: {

          responsive: true,

          maintainAspectRatio: false,

          plugins: {

            legend: {

              position: 'bottom',

              labels: {
                color: '#ffffff',
                usePointStyle: true
              }
            }
          }
        }
      }
    );

    this.charts.push(categoryChart);

    // Savings Trend Line Chart

    const savingsChart = new Chart(
      this.savingsChartRef.nativeElement,
      {
        type: 'line',

        data: {

          labels: months.map(
            item => item.month
          ),

          datasets: [
            {
              label: 'Savings',

              data: months.map(
                item =>
                  Math.max(
                    item.income - item.expenses,
                    0
                  )
              ),

              borderColor: '#0891b2',

              backgroundColor:
                'rgba(8,145,178,0.18)',

              fill: true,

              tension: 0.4,

              pointRadius: 4
            }
          ]
        },

        options: this.axisOptions()
      }
    );

    this.charts.push(savingsChart);
  }

  axisOptions(): any {

    return {

      responsive: true,

      maintainAspectRatio: false,

      animation: {
        duration: 1200
      },

      plugins: {

        legend: {

          labels: {
            color: '#ffffff',
            usePointStyle: true
          }
        }
      },

      scales: {

        x: {

          ticks: {
            color: '#94a3b8'
          },

          grid: {
            color: 'rgba(255,255,255,0.05)'
          }
        },

        y: {

          ticks: {
            color: '#94a3b8'
          },

          grid: {
            color: 'rgba(255,255,255,0.05)'
          }
        }
      }
    };
  }

  ngOnDestroy(): void {

    this.charts.forEach(chart => {

      try {

        chart.destroy();

      } catch {}
    });
  }
}