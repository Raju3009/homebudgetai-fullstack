import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private baseUrl = 'https://localhost:44317/api';

  constructor(private http: HttpClient) {}

  getExpenses() {
    return this.http.get<any[]>(`${this.baseUrl}/Expense`);
  }

  addExpense(data: any) {
    return this.http.post(`${this.baseUrl}/Expense`, data);
  }
  deleteExpense(id: number) {
  return this.http.delete(`${this.baseUrl}/Expense/${id}`);
}
updateExpense(id: number, data: any) {
  return this.http.put(`${this.baseUrl}/Expense/${id}`, data);
}
}