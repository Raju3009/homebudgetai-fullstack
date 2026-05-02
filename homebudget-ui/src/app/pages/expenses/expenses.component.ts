import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit {

  expenses: any[] = [];
  chart: any;

  newExpense = {
    title: '',
    amount: 0,
    category: ''
  };

  editId: number | null = null;

  editExpense: any = {
    id: 0,
    title: '',
    amount: 0,
    category: ''
  };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  // ============================
  // INIT
  // ============================
  ngOnInit() {
    this.loadExpenses();
  }

  // ============================
  // 📥 LOAD DATA
  // ============================
loadExpenses() {
  this.api.getExpenses().subscribe({
    next: (res: any) => {
      this.expenses = res;

      this.cdr.detectChanges(); // 🔥 force UI update

      this.createChart(); // now safe
    },
    error: (err) => console.error(err)
  });
}

  // ============================
  // ➕ ADD
  // ============================
  addExpense() {
    this.api.addExpense(this.newExpense).subscribe({
      next: () => {
        this.newExpense = { title: '', amount: 0, category: '' };
        this.loadExpenses();
      },
      error: (err) => console.error(err)
    });
  }

  // ============================
  // ❌ DELETE
  // ============================
  deleteExpense(id: number) {
    this.api.deleteExpense(id).subscribe({
      next: () => this.loadExpenses(),
      error: (err) => console.error(err)
    });
  }

  // ============================
  // ✏️ EDIT
  // ============================
  startEdit(e: any) {
    this.editId = e.id;
    this.editExpense = { ...e };
  }

  cancelEdit() {
    this.editId = null;
  }

  updateExpense() {
    this.api.updateExpense(this.editExpense.id, this.editExpense).subscribe({
      next: () => {
        this.editId = null;
        this.loadExpenses();
      },
      error: (err) => console.error(err)
    });
  }

  // ============================
  // 📊 CHART (PREMIUM)
  // ============================
  createChart() {

    const canvas = document.getElementById('expenseChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const categoryTotals: any = {};

    this.expenses.forEach(e => {
      const cat = e.category || 'Other';
      categoryTotals[cat] =
        (categoryTotals[cat] || 0) + Number(e.amount);
    });

    const colors = [
      '#6366F1', // indigo
      '#22C55E', // green
      '#F59E0B', // yellow
      '#EF4444', // red
      '#3B82F6', // blue
      '#8B5CF6'  // purple
    ];

    this.chart = new Chart(canvas, {
      type: 'doughnut', // 🔥 premium

      data: {
        labels: Object.keys(categoryTotals),
        datasets: [
          {
            data: Object.values(categoryTotals),
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff'
          }
        ]
      },

      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%', // donut style

        plugins: {
          legend: {
            display: true,
            position: 'bottom'
          }
        }
      }
    });
  }
}