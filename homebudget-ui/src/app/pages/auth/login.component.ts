import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], template: `
<section class="auth-page"><form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
  <h1>Welcome back</h1><p>Sign in to manage household cash flow, goals, and spending insights.</p>
  <label>Email<input formControlName="email" type="email"></label>
  <label>Password<input formControlName="password" type="password"></label>
  <button [disabled]="form.invalid || loading()">{{ loading() ? 'Signing in...' : 'Login' }}</button>
  <p class="error" *ngIf="error()">{{ error() }}</p>
  <div class="auth-links"><a routerLink="/forgot-password">Forgot password?</a><a routerLink="/register">Create account</a></div>
  <small>Demo: demo@homebudget.ai / Demo@12345</small>
</form></section>` })
export class LoginComponent {
  private fb = inject(FormBuilder); private auth = inject(AuthService); private router = inject(Router);
  loading = signal(false); error = signal('');
  form = this.fb.nonNullable.group({ email: ['demo@homebudget.ai', [Validators.required, Validators.email]], password: ['Demo@12345', Validators.required] });
  submit() { if (this.form.invalid) return; this.loading.set(true); this.error.set(''); const v = this.form.getRawValue(); this.auth.login(v.email, v.password).subscribe({ next: () => this.router.navigateByUrl('/dashboard'), error: e => { this.error.set(e.error?.message ?? 'Login failed'); this.loading.set(false); } }); }
}
