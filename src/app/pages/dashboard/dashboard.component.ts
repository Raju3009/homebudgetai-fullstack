import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';

import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  expenses: any[] = [];
  chart: Chart | null = null;
  pieChart: Chart | null = null;
  total = 0;
  income = 0;
  expense = 0;
  selectedExpense: any = null;
  isEditModalOpen = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.api.getExpenses().subscribe({
      next: (res: any) => {
        this.expenses = res?.$values ? res.$values : res;
        this.calculateSummary();
        this.cdr.detectChanges();

        setTimeout(() => {
          this.createBarChart();
          this.createPieChart();
        }, 150);
      },
      error: (err) => {
        console.error('Unable to load transactions', err);
        this.expenses = [];
        this.calculateSummary();
        this.cdr.detectChanges();
        setTimeout(() => {
          this.createBarChart();
          this.createPieChart();
        }, 150);
      }
    });
  }

  calculateSummary(): void {
    this.income = 0;
    this.expense = 0;

    this.expenses.forEach((entry) => {
      const amount = Number(entry.amount || 0);
      const type = (entry.type || 'Expense').toLowerCase().trim();

      if (type === 'income') {
        this.income += amount;
      } else {
        this.expense += amount;
      }
    });

    this.total = this.income - this.expense;
  }

  createBarChart(): void {
    const canvas = document.getElementById('barChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.chart?.destroy();

    const monthly: Record<string, number> = {};
    this.expenses
      .filter((entry) => (entry.type || 'Expense').toLowerCase().trim() !== 'income')
      .forEach((entry) => {
        const date = new Date(entry.date);
        const month = Number.isNaN(date.getTime())
          ? 'No date'
          : date.toLocaleString('default', { month: 'short' });

        monthly[month] = (monthly[month] || 0) + Number(entry.amount || 0);
      });

    const labels = Object.keys(monthly);
    const data = Object.values(monthly);

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels.length ? labels : ['No data'],
        datasets: [
          {
            label: 'Monthly expenses',
            data: data.length ? data : [0],
            backgroundColor: ['#4F46E5', '#14B8A6', '#EC4899', '#F97316', '#22C55E', '#06B6D4'],
            borderRadius: 14,
            borderSkipped: false
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(148, 163, 184, 0.18)' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  createPieChart(): void {
    const canvas = document.getElementById('pieChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.pieChart?.destroy();

    const categories: Record<string, number> = {};
    this.expenses
      .filter((entry) => (entry.type || 'Expense').toLowerCase().trim() !== 'income')
      .forEach((entry) => {
        const category = entry.category || 'Other';
        categories[category] = (categories[category] || 0) + Number(entry.amount || 0);
      });

    const labels = Object.keys(categories);
    const data = Object.values(categories);

    this.pieChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No data'],
        datasets: [
          {
            data: data.length ? data : [1],
            backgroundColor: ['#4F46E5', '#EC4899', '#14B8A6', '#F97316', '#06B6D4', '#A855F7'],
            borderColor: '#ffffff',
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '58%',
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  deleteExpense(id: number): void {
    if (!confirm('Delete this transaction?')) return;

    this.api.deleteExpense(id).subscribe({
      next: () => {
        this.expenses = this.expenses.filter((entry) => entry.id !== id);
        this.calculateSummary();
        this.createBarChart();
        this.createPieChart();
      },
      error: (err) => console.error('Unable to delete transaction', err)
    });
  }

  openEdit(expense: any): void {
    this.selectedExpense = { ...expense };
    this.isEditModalOpen = true;
  }

  closeModal(): void {
    this.isEditModalOpen = false;
  }

  updateExpense(): void {
    if (!this.selectedExpense) return;

    this.api.updateExpense(this.selectedExpense.id, this.selectedExpense).subscribe({
      next: () => {
        this.loadData();
        this.isEditModalOpen = false;
      },
      error: (err) => console.error('Unable to update transaction', err)
    });
  }
}
