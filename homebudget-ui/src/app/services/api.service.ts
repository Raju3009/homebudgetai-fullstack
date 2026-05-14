import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export type TransactionType = 'Income' | 'Expense';
export interface Transaction { id: number; title: string; category: string; amount: number; type: TransactionType; date: string; notes?: string; }
export interface Paged<T> { items: T[]; page: number; pageSize: number; totalItems: number; totalPages: number; }
export interface DashboardSummary { income: number; expenses: number; balance: number; savingsRate: number; categoryTotals: { category: string; total: number }[]; monthlyTotals: { month: string; income: number; expenses: number }[]; recentTransactions: Transaction[]; suggestions: string[]; }
export interface Profile { id: number; fullName: string; email: string; role: string; avatarUrl?: string; }
export interface Budget { id: number; name: string; category: string; limitAmount: number; spentAmount: number; month: string; alertThreshold: number; isActive: boolean; }
export interface Goal { id: number; name: string; targetAmount: number; currentAmount: number; dueDate: string; color: string; }
export interface NotificationItem { id: number; title: string; message: string; type: string; isRead: boolean; createdAt: string; }
export interface UserSetting { currency: string; language: string; theme: string; emailNotifications: boolean; pushNotifications: boolean; monthlyDigest: boolean; }
export interface ReportSummary { income: number; expenses: number; balance: number; savingsRate: number; categories: { category: string; total: number }[]; months: { month: string; income: number; expenses: number }[]; insights: string[]; generatedAt: string; }

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  dashboard() { return this.http.get<DashboardSummary>(`${environment.apiUrl}/Dashboard`); }

  transactions(filters: Record<string, string | number | undefined>) {
    return this.http.get<Paged<Transaction>>(`${environment.apiUrl}/Transactions`, { params: this.params(filters) });
  }

  addTransaction(data: Partial<Transaction>) { return this.http.post<Transaction>(`${environment.apiUrl}/Transactions`, data); }
  updateTransaction(id: number, data: Partial<Transaction>) { return this.http.put<Transaction>(`${environment.apiUrl}/Transactions/${id}`, data); }
  deleteTransaction(id: number) { return this.http.delete(`${environment.apiUrl}/Transactions/${id}`); }
  exportTransactions(filters: Record<string, string | number | undefined>) { return this.http.get(`${environment.apiUrl}/Transactions/export`, { params: this.params(filters), responseType: 'blob' }); }

  budgets() { return this.http.get<Budget[]>(`${environment.apiUrl}/Budgets`); }
  saveBudget(data: Partial<Budget>) { return data.id ? this.http.put<Budget>(`${environment.apiUrl}/Budgets/${data.id}`, data) : this.http.post<Budget>(`${environment.apiUrl}/Budgets`, data); }
  deleteBudget(id: number) { return this.http.delete(`${environment.apiUrl}/Budgets/${id}`); }

  goals() { return this.http.get<Goal[]>(`${environment.apiUrl}/Goals`); }
  saveGoal(data: Partial<Goal>) { return data.id ? this.http.put<Goal>(`${environment.apiUrl}/Goals/${data.id}`, data) : this.http.post<Goal>(`${environment.apiUrl}/Goals`, data); }

  report(params: Record<string, string | number | undefined>) { return this.http.get<ReportSummary>(`${environment.apiUrl}/Reports/summary`, { params: this.params(params) }); }
  exportReportCsv(params: Record<string, string | number | undefined>) { return this.http.get(`${environment.apiUrl}/Reports/export`, { params: this.params(params), responseType: 'blob' }); }

  notifications() { return this.http.get<NotificationItem[]>(`${environment.apiUrl}/Notifications`); }
  markNotificationRead(id: number) { return this.http.post(`${environment.apiUrl}/Notifications/${id}/read`, {}); }

  settings() { return this.http.get<UserSetting>(`${environment.apiUrl}/Settings`); }
  updateSettings(data: Partial<UserSetting>) { return this.http.put<UserSetting>(`${environment.apiUrl}/Settings`, data); }

  me() { return this.http.get<Profile>(`${environment.apiUrl}/Auth/me`); }
  updateProfile(data: Partial<Profile>) { return this.http.put<Profile>(`${environment.apiUrl}/Profile`, data); }
  changePassword(currentPassword: string, newPassword: string) { return this.http.post(`${environment.apiUrl}/Profile/change-password`, { currentPassword, newPassword }); }

  getExpenses() { return this.transactions({ page: 1, pageSize: 100, type: 'Expense' }); }
  addExpense(data: any) { return this.addTransaction({ ...data, type: 'Expense', date: new Date().toISOString() }); }
  updateExpense(id: number, data: any) { return this.updateTransaction(id, data); }
  deleteExpense(id: number) { return this.deleteTransaction(id); }

  private params(filters: Record<string, string | number | boolean | undefined>) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') params = params.set(key, String(value));
    });
    return params;
  }
}
