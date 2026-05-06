import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import Chart from 'chart.js/auto';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {

  expenses: any[] = [];
  chart: any;

  total = 0;
  income = 0;
  expense = 0;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadData();
  }

  // ============================
  // LOAD DATA
  // ============================
  loadData() {
    this.api.getExpenses().subscribe((res: any) => {
      this.expenses = res;

      this.calculateSummary();

      // wait for DOM
      requestAnimationFrame(() => this.createChart());
    });
  }

  // ============================
  // SUMMARY CALCULATION (FIXED)
  // ============================
  calculateSummary() {
    this.total = 0;
    this.income = 0;
    this.expense = 0;

    this.expenses.forEach(e => {
      const amount = Number(e.amount);

      this.total += amount;

      // ✅ USE ONE LOGIC ONLY (recommended: category-based)
      if (e.category?.toLowerCase() === 'income') {
        this.income += amount;
      } else {
        this.expense += amount;
      }
    });
  }

  // ============================
  // CHART
  // ============================
  createChart() {
    const canvas = document.getElementById('barChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const monthly: any = {};

    this.expenses.forEach(e => {
      const date = new Date(e.date);
      const month = date.toLocaleString('default', { month: 'short' });

      monthly[month] = (monthly[month] || 0) + Number(e.amount);
    });

    this.chart = new Chart(canvas, {
      type: 'bar',

      data: {
        labels: Object.keys(monthly),
        datasets: [
          {
            label: 'Monthly Expenses',
            data: Object.values(monthly),
            backgroundColor: '#6366F1' // 🔥 premium color
          }
        ]
      },

      options: {
        responsive: true,
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
}