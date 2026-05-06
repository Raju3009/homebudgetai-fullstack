import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Chart from 'chart.js/auto';

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
    category: '',
    type: 'Expense'
  };

  editId: number | null = null;

  editExpense: any = {
    id: 0,
    title: '',
    amount: 0,
    category: '',
    type: 'Expense'
  };

  constructor(private api: ApiService, private cdr: ChangeDetectorRef) {}

  // ============================
  // INIT
  // ============================
  ngOnInit() {
    this.loadExpenses();
  }

  // ============================
  // 📥 LOAD DATA (FIXED)
  // ============================
  loadExpenses() {
    this.api.getExpenses().subscribe({
      next: (res: any) => {

        console.log("API DATA 👉", res); // 🔥 DEBUG

        // ✅ HANDLE .NET RESPONSE ($values)
        this.expenses = res?.$values ? res.$values : res;

        console.log("FINAL DATA 👉", this.expenses);

        this.cdr.detectChanges();
        this.createChart();
      },
      error: (err) => console.error("API ERROR ❌", err)
    });
  }

  // ============================
  // ➕ ADD
  // ============================
  addExpense() {
    this.api.addExpense(this.newExpense).subscribe({
      next: () => {
        this.newExpense = {
          title: '',
          amount: 0,
          category: '',
          type: 'Expense'
        };
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
  // 📊 SUMMARY (FIXED CASE ISSUE)
  // ============================
  getIncome() {
    return this.expenses
      .filter(x => (x.type || '').toLowerCase() === 'income')
      .reduce((sum, x) => sum + Number(x.amount), 0);
  }

  getExpense() {
    return this.expenses
      .filter(x => (x.type || '').toLowerCase() === 'expense')
      .reduce((sum, x) => sum + Number(x.amount), 0);
  }

  getBalance() {
    return this.getIncome() - this.getExpense();
  }

  // ============================
  // 📊 CHART (SAFE VERSION)
  // ============================
  createChart() {

    const canvas = document.getElementById('expenseChart') as HTMLCanvasElement;
    if (!canvas) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const categoryTotals: any = {};

    this.expenses
      .filter(e => (e.type || '').toLowerCase() === 'expense')
      .forEach(e => {
        const cat = e.category || 'Other';
        categoryTotals[cat] =
          (categoryTotals[cat] || 0) + Number(e.amount);
      });

    let labels = Object.keys(categoryTotals);
    let data = Object.values(categoryTotals);

    // ✅ HANDLE EMPTY DATA
    if (labels.length === 0) {
      labels = ['No Data'];
      data = [0];
    }

    const colors = [
      '#6366F1',
      '#22C55E',
      '#F59E0B',
      '#EF4444',
      '#3B82F6',
      '#8B5CF6'
    ];

    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#fff'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
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