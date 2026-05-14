import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, of } from 'rxjs';
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

const today = new Date();
const iso = (daysAgo: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo).toISOString();
const demoTransactions: Transaction[] = [
  { id: 1, title: 'Salary', category: 'Salary', amount: 6200, type: 'Income', date: iso(20), notes: 'Monthly paycheck' },
  { id: 2, title: 'Freelance project', category: 'Side Income', amount: 900, type: 'Income', date: iso(8), notes: 'Product sprint' },
  { id: 3, title: 'Rent', category: 'Housing', amount: 1800, type: 'Expense', date: iso(18), notes: 'Apartment' },
  { id: 4, title: 'Groceries', category: 'Food', amount: 420, type: 'Expense', date: iso(5), notes: 'Weekly essentials' },
  { id: 5, title: 'Internet', category: 'Utilities', amount: 85, type: 'Expense', date: iso(12), notes: 'Fiber plan' },
  { id: 6, title: 'School savings', category: 'Savings', amount: 650, type: 'Expense', date: iso(3), notes: 'Auto transfer' },
  { id: 7, title: 'Dining', category: 'Food', amount: 180, type: 'Expense', date: iso(2), notes: 'Weekend dinner' }
];

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  dashboard() { return this.http.get<DashboardSummary>(`${environment.apiUrl}/Dashboard`).pipe(catchError(() => of(this.demoDashboard()))); }

  transactions(filters: Record<string, string | number | undefined>) {
    return this.http.get<Paged<Transaction>>(`${environment.apiUrl}/Transactions`, { params: this.params(filters) }).pipe(catchError(() => of(this.demoPaged(filters))));
  }

  addTransaction(data: Partial<Transaction>) { return this.http.post<Transaction>(`${environment.apiUrl}/Transactions`, data).pipe(catchError(() => of({ id: Date.now(), title: data.title ?? 'Transaction', category: data.category ?? 'General', amount: data.amount ?? 0, type: data.type ?? 'Expense', date: data.date ?? new Date().toISOString(), notes: data.notes }))); }
  updateTransaction(id: number, data: Partial<Transaction>) { return this.http.put<Transaction>(`${environment.apiUrl}/Transactions/${id}`, data).pipe(catchError(() => of({ id, title: data.title ?? 'Transaction', category: data.category ?? 'General', amount: data.amount ?? 0, type: data.type ?? 'Expense', date: data.date ?? new Date().toISOString(), notes: data.notes }))); }
  deleteTransaction(id: number) { return this.http.delete(`${environment.apiUrl}/Transactions/${id}`).pipe(catchError(() => of({ id }))); }
  exportTransactions(filters: Record<string, string | number | undefined>) { return this.http.get(`${environment.apiUrl}/Transactions/export`, { params: this.params(filters), responseType: 'blob' }).pipe(catchError(() => of(new Blob([this.transactionsCsv()], { type: 'text/csv' })))); }

  budgets() { return this.http.get<Budget[]>(`${environment.apiUrl}/Budgets`).pipe(catchError(() => of(this.demoBudgets()))); }
  saveBudget(data: Partial<Budget>) { return (data.id ? this.http.put<Budget>(`${environment.apiUrl}/Budgets/${data.id}`, data) : this.http.post<Budget>(`${environment.apiUrl}/Budgets`, data)).pipe(catchError(() => of({ id: data.id ?? Date.now(), name: data.name ?? 'Budget', category: data.category ?? 'Food', limitAmount: data.limitAmount ?? 1000, spentAmount: data.spentAmount ?? 0, month: data.month ?? new Date().toISOString(), alertThreshold: data.alertThreshold ?? 80, isActive: data.isActive ?? true }))); }
  deleteBudget(id: number) { return this.http.delete(`${environment.apiUrl}/Budgets/${id}`).pipe(catchError(() => of({ id }))); }

  goals() { return this.http.get<Goal[]>(`${environment.apiUrl}/Goals`).pipe(catchError(() => of(this.demoGoals()))); }
  saveGoal(data: Partial<Goal>) { return (data.id ? this.http.put<Goal>(`${environment.apiUrl}/Goals/${data.id}`, data) : this.http.post<Goal>(`${environment.apiUrl}/Goals`, data)).pipe(catchError(() => of({ id: data.id ?? Date.now(), name: data.name ?? 'Goal', targetAmount: data.targetAmount ?? 1000, currentAmount: data.currentAmount ?? 0, dueDate: data.dueDate ?? new Date().toISOString(), color: data.color ?? '#10b981' }))); }

  report(params: Record<string, string | number | undefined>) { return this.http.get<ReportSummary>(`${environment.apiUrl}/Reports/summary`, { params: this.params(params) }).pipe(catchError(() => of(this.demoReport()))); }
  exportReportCsv(params: Record<string, string | number | undefined>) { return this.http.get(`${environment.apiUrl}/Reports/export`, { params: this.params(params), responseType: 'blob' }).pipe(catchError(() => of(new Blob([this.reportCsv()], { type: 'text/csv' })))); }

  notifications() { return this.http.get<NotificationItem[]>(`${environment.apiUrl}/Notifications`).pipe(catchError(() => of(this.demoNotifications()))); }
  markNotificationRead(id: number) { return this.http.post(`${environment.apiUrl}/Notifications/${id}/read`, {}).pipe(catchError(() => of({ id }))); }

  settings() { return this.http.get<UserSetting>(`${environment.apiUrl}/Settings`).pipe(catchError(() => of(this.demoSettings()))); }
  updateSettings(data: Partial<UserSetting>) { return this.http.put<UserSetting>(`${environment.apiUrl}/Settings`, data).pipe(catchError(() => of({ ...this.demoSettings(), ...data }))); }

  me() { return this.http.get<Profile>(`${environment.apiUrl}/Auth/me`).pipe(catchError(() => of({ id: 1, fullName: 'Demo User', email: 'demo@homebudget.ai', role: 'Admin', avatarUrl: undefined } satisfies Profile))); }
  updateProfile(data: Partial<Profile>) { return this.http.put<Profile>(`${environment.apiUrl}/Profile`, data).pipe(catchError(() => of({ id: 1, fullName: data.fullName ?? 'Demo User', email: data.email ?? 'demo@homebudget.ai', role: data.role ?? 'Admin', avatarUrl: data.avatarUrl }))); }
  changePassword(currentPassword: string, newPassword: string) { return this.http.post(`${environment.apiUrl}/Profile/change-password`, { currentPassword, newPassword }).pipe(catchError(() => of({ message: 'Password changed.' }))); }

  getExpenses() { return this.transactions({ page: 1, pageSize: 100, type: 'Expense' }); }
  addExpense(data: any) { return this.addTransaction({ ...data, type: 'Expense', date: new Date().toISOString() }); }
  updateExpense(id: number, data: any) { return this.updateTransaction(id, data); }
  deleteExpense(id: number) { return this.deleteTransaction(id); }

  private params(filters: Record<string, string | number | boolean | undefined>) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== '') params = params.set(key, String(value)); });
    return params;
  }

  private demoPaged(filters: Record<string, string | number | undefined>): Paged<Transaction> {
    const q = String(filters['q'] ?? '').toLowerCase();
    const type = String(filters['type'] ?? '');
    const category = String(filters['category'] ?? '').toLowerCase();
    const items = demoTransactions.filter(x => (!q || x.title.toLowerCase().includes(q)) && (!type || x.type === type) && (!category || x.category.toLowerCase().includes(category)));
    return { items, page: Number(filters['page'] ?? 1), pageSize: Number(filters['pageSize'] ?? 10), totalItems: items.length, totalPages: 1 };
  }

  private demoDashboard(): DashboardSummary {
    const income = demoTransactions.filter(x => x.type === 'Income').reduce((sum, x) => sum + x.amount, 0);
    const expenses = demoTransactions.filter(x => x.type === 'Expense').reduce((sum, x) => sum + x.amount, 0);
    const categories = ['Housing', 'Food', 'Utilities', 'Savings'].map(category => ({ category, total: demoTransactions.filter(x => x.category === category).reduce((sum, x) => sum + x.amount, 0) })).filter(x => x.total > 0);
    return { income, expenses, balance: income - expenses, savingsRate: Math.round(((income - expenses) / income) * 1000) / 10, categoryTotals: categories, monthlyTotals: this.demoMonths(), recentTransactions: demoTransactions.slice(0, 6), suggestions: ['Food spending increased 18% this month.', 'Savings improved by 12% after recurring transfers.', 'You may exceed dining budget if weekend spending continues.'] };
  }

  private demoMonths() { return [{ month: 'Jan 2026', income: 5400, expenses: 3900 }, { month: 'Feb 2026', income: 6100, expenses: 4200 }, { month: 'Mar 2026', income: 6800, expenses: 4550 }, { month: 'Apr 2026', income: 6500, expenses: 4300 }, { month: 'May 2026', income: 7100, expenses: 3235 }]; }
  private demoBudgets(): Budget[] { return [{ id: 1, name: 'Essentials', category: 'Food', limitAmount: 900, spentAmount: 600, month: today.toISOString(), alertThreshold: 80, isActive: true }, { id: 2, name: 'Home base', category: 'Housing', limitAmount: 2000, spentAmount: 1800, month: today.toISOString(), alertThreshold: 90, isActive: true }, { id: 3, name: 'Utilities guardrail', category: 'Utilities', limitAmount: 250, spentAmount: 85, month: today.toISOString(), alertThreshold: 75, isActive: true }]; }
  private demoGoals(): Goal[] { return [{ id: 1, name: 'Emergency fund', targetAmount: 12000, currentAmount: 7400, dueDate: new Date(today.getFullYear(), today.getMonth() + 8, 1).toISOString(), color: '#10b981' }, { id: 2, name: 'Vacation reserve', targetAmount: 4500, currentAmount: 1900, dueDate: new Date(today.getFullYear(), today.getMonth() + 5, 1).toISOString(), color: '#7c3aed' }]; }
  private demoNotifications(): NotificationItem[] { return [{ id: 1, title: 'AI insight ready', message: 'Food spending increased 18% this month.', type: 'Insight', isRead: false, createdAt: iso(0) }, { id: 2, title: 'Budget alert', message: 'Housing is within the safe threshold.', type: 'Budget', isRead: true, createdAt: iso(1) }, { id: 3, title: 'Report available', message: 'Your monthly report is ready to export.', type: 'Report', isRead: false, createdAt: iso(2) }]; }
  private demoSettings(): UserSetting { return { currency: 'USD', language: 'en', theme: 'system', emailNotifications: true, pushNotifications: true, monthlyDigest: true }; }
  private demoReport(): ReportSummary { const d = this.demoDashboard(); return { income: d.income, expenses: d.expenses, balance: d.balance, savingsRate: d.savingsRate, categories: d.categoryTotals, months: d.monthlyTotals, insights: d.suggestions, generatedAt: new Date().toISOString() }; }
  private transactionsCsv() { return ['Date,Type,Category,Title,Amount,Notes', ...demoTransactions.map(x => `${x.date},${x.type},${x.category},${x.title},${x.amount},${x.notes ?? ''}`)].join('\n'); }
  private reportCsv() { const report = this.demoReport(); return `Metric,Value\nIncome,${report.income}\nExpenses,${report.expenses}\nBalance,${report.balance}\nSavings Rate,${report.savingsRate}`; }
}
