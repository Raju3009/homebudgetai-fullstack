import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

import Chart from 'chart.js/auto';

import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  // =========================================
  // DATA
  // =========================================
  expenses: any[] = [];

  chart: any;

  pieChart: any;

  total = 0;

  income = 0;

  expense = 0;

  darkMode = false;

  // =========================================
  // EDIT MODAL
  // =========================================
  selectedExpense: any = null;

  isEditModalOpen = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  // =========================================
  // INIT
  // =========================================
  ngOnInit(): void {

    this.loadData();
  }

  // =========================================
  // LOAD DATA
  // =========================================
  loadData(): void {

    this.api.getExpenses().subscribe({

      next: (res: any) => {

        console.log('API RESPONSE 👉', res);

        // .NET sometimes returns $values
        this.expenses = res?.$values
          ? res.$values
          : res;

        // calculate totals
        this.calculateSummary();

        // refresh DOM
        this.cdr.detectChanges();

        // wait for canvas render
        setTimeout(() => {

          this.createBarChart();

          this.createPieChart();

        }, 300);
      },

      error: (err) => {

        console.log(err);
      }
    });
  }

  // =========================================
  // SUMMARY
  // =========================================
  calculateSummary(): void {

    this.income = 0;

    this.expense = 0;

    this.expenses.forEach(e => {

      const amount = Number(e.amount || 0);

      const type =
        (e.type || 'Expense')
        .toLowerCase()
        .trim();

      if (type === 'income') {

        this.income += amount;

      } else {

        this.expense += amount;
      }
    });

    this.total =
      this.income - this.expense;
  }

  // =========================================
  // BAR CHART
  // =========================================
  createBarChart(): void {

    const canvas =
      document.getElementById(
        'barChart'
      ) as HTMLCanvasElement;

    if (!canvas) {

      console.log('Bar chart canvas missing');

      return;
    }

    // destroy old chart
    if (this.chart) {
      this.chart.destroy();
    }

    const monthly: any = {};

    // only expenses
    const expenseData =
      this.expenses.filter(e => {

        const type =
          (e.type || 'Expense')
          .toLowerCase()
          .trim();

        return type !== 'income';
      });

    // group by month
    expenseData.forEach(e => {

      const amount =
        Number(e.amount || 0);

      const date =
        new Date(e.date);

      const month =
        date.toLocaleString(
          'default',
          {
            month: 'short'
          }
        );

      if (!monthly[month]) {

        monthly[month] = 0;
      }

      monthly[month] += amount;
    });

    let labels =
      Object.keys(monthly);

    let data =
      Object.values(monthly);

    // fallback
    if (labels.length === 0) {

      labels = ['No Data'];

      data = [0];
    }

    this.chart = new Chart(canvas, {

      type: 'bar',

      data: {

        labels: labels,

        datasets: [
          {
            label: 'Monthly Expenses',

            data: data,

            backgroundColor: [
              '#6366F1',
              '#8B5CF6',
              '#EC4899',
              '#10B981',
              '#F59E0B',
              '#06B6D4'
            ],

            borderRadius: 10
          }
        ]
      },

      options: {

        responsive: true,

        maintainAspectRatio: false,

        plugins: {

          legend: {
            display: true
          }
        },

        scales: {

          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // =========================================
  // PIE CHART
  // =========================================
  createPieChart(): void {

    const canvas =
      document.getElementById(
        'pieChart'
      ) as HTMLCanvasElement;

    if (!canvas) {

      console.log('Pie chart canvas missing');

      return;
    }

    // destroy old pie chart
    if (this.pieChart) {
      this.pieChart.destroy();
    }

    const categories: any = {};

    // only expenses
    const expenseData =
      this.expenses.filter(e => {

        const type =
          (e.type || 'Expense')
          .toLowerCase()
          .trim();

        return type !== 'income';
      });

    // group by category
    expenseData.forEach(e => {

      const category =
        e.category || 'Other';

      const amount =
        Number(e.amount || 0);

      if (!categories[category]) {

        categories[category] = 0;
      }

      categories[category] += amount;
    });

    let labels =
      Object.keys(categories);

    let data =
      Object.values(categories);

    // fallback
    if (labels.length === 0) {

      labels = ['No Data'];

      data = [1];
    }

    this.pieChart = new Chart(canvas, {

      type: 'pie',

      data: {

        labels: labels,

        datasets: [
          {
            data: data,

            backgroundColor: [
              '#6366F1',
              '#EC4899',
              '#10B981',
              '#F59E0B',
              '#06B6D4',
              '#8B5CF6'
            ]
          }
        ]
      },

      options: {

        responsive: true,

        plugins: {

          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  // =========================================
  // DELETE
  // =========================================
  deleteExpense(id: number): void {

    const confirmDelete =
      confirm(
        'Delete this transaction?'
      );

    if (!confirmDelete) return;

    this.api.deleteExpense(id)
      .subscribe({

        next: () => {

          this.expenses =
            this.expenses.filter(
              e => e.id !== id
            );

          this.calculateSummary();

          this.createBarChart();

          this.createPieChart();
        },

        error: (err) => {

          console.log(err);
        }
      });
  }

  // =========================================
  // OPEN EDIT
  // =========================================
  openEdit(expense: any): void {

    this.selectedExpense = {
      ...expense
    };

    this.isEditModalOpen = true;
  }

  // =========================================
  // CLOSE MODAL
  // =========================================
  closeModal(): void {

    this.isEditModalOpen = false;
  }

  // =========================================
  // UPDATE
  // =========================================
  updateExpense(): void {

    if (!this.selectedExpense)
      return;

    this.api.updateExpense(

      this.selectedExpense.id,

      this.selectedExpense

    ).subscribe({

      next: () => {

        this.loadData();

        this.isEditModalOpen = false;
      },

      error: (err) => {

        console.log(err);
      }
    });
  }
}