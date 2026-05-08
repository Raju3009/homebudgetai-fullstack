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
  readonly isAuthenticated = computed(() => !!this.state()?.token && !this.isExpired(this.state()));
  readonly isAdmin = computed(() => this.state()?.role === 'Admin' && this.isAuthenticated());

  constructor(private http: HttpClient, private router: Router) {
    if (this.state() && this.isExpired(this.state())) this.clear();
  }

  login(email: string, password: string, rememberMe = true) {
    return this.http.post<AuthUser>(`${environment.apiUrl}/Auth/login`, { email, password }).pipe(tap(user => this.store(user, rememberMe)));
  }

  register(fullName: string, email: string, password: string, rememberMe = true) {
    return this.http.post<AuthUser>(`${environment.apiUrl}/Auth/register`, { fullName, email, password }).pipe(tap(user => this.store(user, rememberMe)));
  }

  forgotPassword(email: string) {
    return this.http.post<{ message: string; resetToken?: string }>(`${environment.apiUrl}/Auth/forgot-password`, { email });
  }

  resetPassword(email: string, token: string, newPassword: string) {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/Auth/reset-password`, { email, token, newPassword });
  }

  logout(redirect = true) {
    this.clear();
    if (redirect) this.router.navigateByUrl('/login');
  }

  token() {
    const user = this.state();
    if (!user || this.isExpired(user)) { this.clear(); return null; }
    return user.token;
  }

  hasRole(role: string) { return this.state()?.role === role && this.isAuthenticated(); }

  private store(user: AuthUser, rememberMe: boolean) {
    this.clearStorage();
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem(this.key, JSON.stringify(user));
    this.state.set(user);
  }

  private read(): AuthUser | null {
    const raw = localStorage.getItem(this.key) ?? sessionStorage.getItem(this.key);
    if (!raw) return null;
    try {
      const user = JSON.parse(raw) as AuthUser;
      return this.isExpired(user) ? null : user;
    } catch { return null; }
  }

  private isExpired(user: AuthUser | null) {
    return !user?.expiresAt || new Date(user.expiresAt).getTime() <= Date.now();
  }

  private clear() { this.clearStorage(); this.state.set(null); }
  private clearStorage() { localStorage.removeItem(this.key); sessionStorage.removeItem(this.key); }
}
