import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  // =========================================
  // BACKEND URL
  // =========================================
  private baseUrl = 'https://localhost:44317/api';

  constructor(private http: HttpClient) {}

  // =========================================
  // GET ALL EXPENSES
  // =========================================
  getExpenses() {

    return this.http.get<any[]>(
      `${this.baseUrl}/Expense`
    );
  }

  // =========================================
  // GET SINGLE EXPENSE
  // =========================================
  getExpenseById(id: number) {

    return this.http.get<any>(
      `${this.baseUrl}/Expense/${id}`
    );
  }

  // =========================================
  // ADD EXPENSE / INCOME
  // =========================================
  addExpense(data: any) {

    return this.http.post(
      `${this.baseUrl}/Expense`,
      data
    );
  }

  // =========================================
  // UPDATE EXPENSE
  // =========================================
  updateExpense(
    id: number,
    data: any
  ) {

    return this.http.put(
      `${this.baseUrl}/Expense/${id}`,
      data
    );
  }

  // =========================================
  // DELETE EXPENSE
  // =========================================
  deleteExpense(id: number) {

    return this.http.delete(
      `${this.baseUrl}/Expense/${id}`
    );
  }

  // =========================================
  // SUMMARY ANALYTICS
  // =========================================
  getSummary() {

    return this.http.get(
      `${this.baseUrl}/Expense/summary`
    );
  }

  // =========================================
  // MONTHLY ANALYTICS
  // =========================================
  getMonthlyAnalytics() {

    return this.http.get(
      `${this.baseUrl}/Expense/monthly`
    );
  }

  // =========================================
  // CATEGORY ANALYTICS
  // =========================================
  getCategoryAnalytics() {

    return this.http.get(
      `${this.baseUrl}/Expense/categories`
    );
  }
}