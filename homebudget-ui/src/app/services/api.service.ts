import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type TransactionType = 'Income' | 'Expense';
export interface Transaction { id: number; title: string; category: string; amount: number; type: TransactionType; date: string; notes?: string; }
export interface Paged<T> { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number; }
export interface DashboardSummary { income: number; expenses: number; balance: number; categoryTotals: { category: string; total: number }[]; monthlyTotals: { month: string; income: number; expenses: number }[]; suggestions: string[]; }
export interface Profile { id: number; fullName: string; email: string; role: string; avatarUrl?: string; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  dashboard() { return this.http.get<DashboardSummary>(`${environment.apiUrl}/Dashboard`); }
  transactions(filters: Record<string, string | number | undefined>) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params = params.set(key, String(value)); });
    return this.http.get<Paged<Transaction>>(`${environment.apiUrl}/Transactions`, { params });
  }
  addTransaction(data: Partial<Transaction>) { return this.http.post<Transaction>(`${environment.apiUrl}/Transactions`, data); }
  updateTransaction(id: number, data: Partial<Transaction>) { return this.http.put<Transaction>(`${environment.apiUrl}/Transactions/${id}`, data); }
  deleteTransaction(id: number) { return this.http.delete(`${environment.apiUrl}/Transactions/${id}`); }
  exportUrl() { return `${environment.apiUrl}/Transactions/export`; }
  me() { return this.http.get<Profile>(`${environment.apiUrl}/Auth/me`); }
  updateProfile(data: Partial<Profile>) { return this.http.put<Profile>(`${environment.apiUrl}/Profile`, data); }
  changePassword(currentPassword: string, newPassword: string) { return this.http.post(`${environment.apiUrl}/Profile/change-password`, { currentPassword, newPassword }); }

  getExpenses() { return this.transactions({ page: 1, pageSize: 100 }); }
  addExpense(data: any) { return this.addTransaction({ ...data, type: 'Expense', date: new Date().toISOString() }); }
  updateExpense(id: number, data: any) { return this.updateTransaction(id, data); }
  deleteExpense(id: number) { return this.deleteTransaction(id); }
}
