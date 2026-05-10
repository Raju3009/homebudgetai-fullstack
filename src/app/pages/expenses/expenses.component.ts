import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import Chart from 'chart.js/auto';

import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './expenses.component.html',
  styleUrls: ['./expenses.component.css']
})
export class ExpensesComponent implements OnInit {
  expenses: any[] = [];
  chart: Chart | null = null;

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

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadExpenses();
  }

  loadExpenses(): void {
    this.api.getExpenses().subscribe({
      next: (res: any) => {
        this.expenses = res?.$values ? res.$values : res;
        this.cdr.detectChanges();
        this.createChart();
      },
      error: (err) => {
        console.error('Unable to load transactions', err);
        this.expenses = [];
        this.cdr.detectChanges();
        this.createChart();
      }
    });
  }

  addExpense(): void {
    if (!this.newExpense.title || !this.newExpense.amount) return;

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
      error: (err) => console.error('Unable to add transaction', err)
    });
  }

  deleteExpense(id: number): void {
    this.api.deleteExpense(id).subscribe({
      next: () => this.loadExpenses(),
      error: (err) => console.error('Unable to delete transaction', err)
    });
  }

  startEdit(expense: any): void {
    this.editId = expense.id;
    this.editExpense = { ...expense };
  }

  cancelEdit(): void {
    this.editId = null;
  }

  updateExpense(): void {
    this.api.updateExpense(this.editExpense.id, this.editExpense).subscribe({
      next: () => {
        this.editId = null;
        this.loadExpenses();
      },
      error: (err) => console.error('Unable to update transaction', err)
    });
  }

  getIncome(): number {
    return this.expenses
      .filter((entry) => (entry.type || '').toLowerCase() === 'income')
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
  }

  getExpense(): number {
    return this.expenses
      .filter((entry) => (entry.type || '').toLowerCase() === 'expense')
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
  }

  getBalance(): number {
    return this.getIncome() - this.getExpense();
  }

  createChart(): void {
    const canvas = document.getElementById('expenseChart') as HTMLCanvasElement;
    if (!canvas) return;

    this.chart?.destroy();

    const categoryTotals: Record<string, number> = {};
    this.expenses
      .filter((entry) => (entry.type || '').toLowerCase() === 'expense')
      .forEach((entry) => {
        const category = entry.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + Number(entry.amount);
      });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    this.chart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels.length ? labels : ['No data'],
        datasets: [
          {
            data: data.length ? data : [1],
            backgroundColor: ['#4F46E5', '#14B8A6', '#F97316', '#EC4899', '#06B6D4', '#A855F7'],
            borderWidth: 3,
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
