import {
  Injectable,
  signal
} from '@angular/core';

import {
  HttpClient,
  HttpHeaders
} from '@angular/common/http';

import {
  Observable,
  tap
} from 'rxjs';

import { environment }
from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // =========================
  // API URL
  // =========================

  private baseUrl =
    environment.apiUrl;

  // =========================
  // USER SIGNAL
  // =========================

  private userSignal =
    signal<any>(this.loadUser());

  constructor(
    private http: HttpClient
  ) {}

  // =========================
  // LOGIN
  // =========================

  login(data: any): Observable<any> {

    return this.http.post<any>(

      `${this.baseUrl}/auth/login`,

      data

    ).pipe(

      tap(response => {

        this.storeAuth(response);

      })
    );
  }

  // =========================
  // REGISTER
  // =========================

  register(data: any): Observable<any> {

    return this.http.post<any>(

      `${this.baseUrl}/auth/register`,

      data

    ).pipe(

      tap(response => {

        this.storeAuth(response);

      })
    );
  }

  // =========================
  // FORGOT PASSWORD
  // =========================

  forgotPassword(
    email: string
  ): Observable<any> {

    return this.http.post<any>(

      `${this.baseUrl}/auth/forgot-password`,

      { email }

    );
  }

  // =========================
  // RESET PASSWORD
  // =========================

  resetPassword(
    data: any
  ): Observable<any> {

    return this.http.post<any>(

      `${this.baseUrl}/auth/reset-password`,

      data

    );
  }

  // =========================
  // STORE AUTH DATA
  // =========================

  private storeAuth(
    response: any
  ): void {

    // TOKEN

    if (response.token) {

      localStorage.setItem(
        'token',
        response.token
      );
    }

    // REFRESH TOKEN

    if (response.refreshToken) {

      localStorage.setItem(
        'refreshToken',
        response.refreshToken
      );
    }

    // USER

    const user = {

      email:
        response.email,

      fullName:
        response.fullName,

      role:
        response.role
    };

    localStorage.setItem(

      'user',

      JSON.stringify(user)
    );

    // UPDATE SIGNAL

    this.userSignal.set(user);
  }

  // =========================
  // LOAD USER
  // =========================

  private loadUser(): any {

    const user =
      localStorage.getItem('user');

    return user
      ? JSON.parse(user)
      : null;
  }

  // =========================
  // TOKEN
  // =========================

  token(): string | null {

    return localStorage.getItem(
      'token'
    );
  }

  // =========================
  // GET TOKEN
  // =========================

  getToken(): string | null {

    return this.token();
  }

  // =========================
  // USER
  // =========================

  user() {

    return this.userSignal();
  }

  // =========================
  // GET USER
  // =========================

  getUser(): any {

    return this.user();
  }

  // =========================
  // AUTH CHECK
  // =========================

  isAuthenticated(): boolean {

    return !!this.token();
  }

  // =========================
  // ROLE CHECK
  // =========================

  hasRole(
    role: string
  ): boolean {

    return this.user()?.role === role;
  }

  // =========================
  // LOGOUT
  // =========================

  logout(
    redirect: boolean = true
  ): void {

    localStorage.removeItem(
      'token'
    );

    localStorage.removeItem(
      'refreshToken'
    );

    localStorage.removeItem(
      'user'
    );

    this.userSignal.set(null);

    if (redirect) {

      window.location.href =
        '/login';
    }
  }

  // =========================
  // AUTH HEADERS
  // =========================

  getAuthHeaders(): HttpHeaders {

    const token =
      this.token();

    return new HttpHeaders({

      Authorization:
        `Bearer ${token}`
    });
  }
}