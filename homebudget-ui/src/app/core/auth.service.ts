import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AuthUser { token: string; email: string; fullName: string; role: string; expiresAt: string; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly key = 'homebudgetai.auth';
  private readonly state = signal<AuthUser | null>(this.read());
  readonly user = computed(() => this.state());
  readonly isAuthenticated = computed(() => !!this.state()?.token);

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http.post<AuthUser>(`${environment.apiUrl}/Auth/login`, { email, password }).pipe(tap(user => this.store(user)));
  }

  register(fullName: string, email: string, password: string) {
    return this.http.post<AuthUser>(`${environment.apiUrl}/Auth/register`, { fullName, email, password }).pipe(tap(user => this.store(user)));
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string; resetToken?: string }>(`${environment.apiUrl}/Auth/forgot-password`, { email });
  }

  logout() {
    localStorage.removeItem(this.key);
    this.state.set(null);
    this.router.navigateByUrl('/login');
  }

  token() { return this.state()?.token ?? null; }

  private store(user: AuthUser) {
    localStorage.setItem(this.key, JSON.stringify(user));
    this.state.set(user);
  }

  private read(): AuthUser | null {
    try { return JSON.parse(localStorage.getItem(this.key) ?? 'null'); } catch { return null; }
  }
}
