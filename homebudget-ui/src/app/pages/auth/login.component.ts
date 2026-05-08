import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], template: `
<section class="auth-page"><form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
  <h1>Welcome back</h1><p>Sign in to manage household cash flow, goals, and spending insights.</p>
  <label>Email<input formControlName="email" type="email" autocomplete="email"></label>
  <label>Password<input formControlName="password" type="password" autocomplete="current-password"></label>
  <label class="inline-check"><input formControlName="rememberMe" type="checkbox"> Remember me on this device</label>
  <button [disabled]="form.invalid || loading()">{{ loading() ? 'Signing in...' : 'Login' }}</button>
  <p class="error" *ngIf="error()">{{ error() }}</p>
  <div class="auth-links"><a routerLink="/forgot-password">Forgot password?</a><a routerLink="/register">Create account</a></div>
  <small>Demo: demo@homebudget.ai / Demo@12345</small>
</form></section>` })
export class LoginComponent {
  private fb = inject(FormBuilder); private auth = inject(AuthService); private router = inject(Router); private route = inject(ActivatedRoute);
  loading = signal(false); error = signal(this.route.snapshot.queryParamMap.get('expired') ? 'Your session expired. Please sign in again.' : '');
  form = this.fb.nonNullable.group({ email: ['demo@homebudget.ai', [Validators.required, Validators.email]], password: ['Demo@12345', Validators.required], rememberMe: [true] });
  submit() {
    if (this.form.invalid) return;
    this.loading.set(true); this.error.set('');
    const v = this.form.getRawValue();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/dashboard';
    this.auth.login(v.email, v.password, v.rememberMe).subscribe({
      next: () => this.router.navigateByUrl(returnUrl),
      error: e => { this.error.set(e.error?.message ?? 'Login failed'); this.loading.set(false); }
    });
  }
}
