import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  return control.get('password')?.value === control.get('confirmPassword')?.value ? null : { mismatch: true };
}

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], template: `
<section class="auth-page"><form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
  <h1>Create account</h1><p>Start with secure authentication and seeded budget analytics.</p>
  <label>Full name<input formControlName="fullName" autocomplete="name"></label>
  <label>Email<input formControlName="email" type="email" autocomplete="email"></label>
  <label>Password<input formControlName="password" type="password" autocomplete="new-password"></label>
  <label>Confirm password<input formControlName="confirmPassword" type="password" autocomplete="new-password"></label>
  <label class="inline-check"><input formControlName="rememberMe" type="checkbox"> Keep me signed in</label>
  <small>Password must be at least 8 characters.</small>
  <p class="error" *ngIf="form.hasError('mismatch') && form.touched">Passwords do not match.</p>
  <button [disabled]="form.invalid || loading()">{{ loading() ? 'Creating...' : 'Register' }}</button><p class="error" *ngIf="error()">{{ error() }}</p><a routerLink="/login">Already have an account?</a>
</form></section>` })
export class RegisterComponent {
  private fb = inject(FormBuilder); private auth = inject(AuthService); private router = inject(Router);
  loading = signal(false); error = signal('');
  form = this.fb.nonNullable.group({ fullName: ['', Validators.required], email: ['', [Validators.required, Validators.email]], password: ['', [Validators.required, Validators.minLength(8)]], confirmPassword: ['', Validators.required], rememberMe: [true] }, { validators: passwordsMatch });
  submit() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue(); this.loading.set(true); this.error.set('');
    this.auth.register(v.fullName, v.email, v.password, v.rememberMe).subscribe({ next: () => this.router.navigateByUrl('/dashboard'), error: e => { this.error.set(e.error?.message ?? 'Registration failed'); this.loading.set(false); } });
  }
}
