import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], template: `
<section class="auth-page"><form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
  <h1>Create account</h1><p>Start with secure authentication and seeded budget analytics.</p>
  <label>Full name<input formControlName="fullName"></label><label>Email<input formControlName="email" type="email"></label><label>Password<input formControlName="password" type="password"></label>
  <button [disabled]="form.invalid || loading()">{{ loading() ? 'Creating...' : 'Register' }}</button><p class="error" *ngIf="error()">{{ error() }}</p><a routerLink="/login">Already have an account?</a>
</form></section>` })
export class RegisterComponent {
  private fb = inject(FormBuilder); private auth = inject(AuthService); private router = inject(Router);
  loading = signal(false); error = signal('');
  form = this.fb.nonNullable.group({ fullName: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]] });
  submit() { const v = this.form.getRawValue(); this.loading.set(true); this.auth.register(v.fullName, v.email, v.password).subscribe({ next: () => this.router.navigateByUrl('/dashboard'), error: e => { this.error.set(e.error?.message ?? 'Registration failed'); this.loading.set(false); } }); }
}
