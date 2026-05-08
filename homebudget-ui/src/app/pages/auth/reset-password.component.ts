import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  return control.get('newPassword')?.value === control.get('confirmPassword')?.value ? null : { mismatch: true };
}

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], template: `
<section class="auth-page"><form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
  <h1>Set new password</h1><p>Use the reset token generated from the forgot-password flow.</p>
  <label>Email<input formControlName="email" type="email" autocomplete="email"></label>
  <label>Reset token<input formControlName="token"></label>
  <label>New password<input formControlName="newPassword" type="password" autocomplete="new-password"></label>
  <label>Confirm password<input formControlName="confirmPassword" type="password" autocomplete="new-password"></label>
  <p class="error" *ngIf="form.hasError('mismatch') && form.touched">Passwords do not match.</p>
  <button [disabled]="form.invalid || loading()">{{ loading() ? 'Resetting...' : 'Reset password' }}</button>
  <p [class.error]="isError()" [class.success]="!isError()" *ngIf="message()">{{ message() }}</p>
  <a routerLink="/login">Back to login</a>
</form></section>` })
export class ResetPasswordComponent {
  private fb = inject(FormBuilder); private auth = inject(AuthService); private route = inject(ActivatedRoute); private router = inject(Router);
  loading = signal(false); message = signal(''); isError = signal(false);
  form = this.fb.nonNullable.group({ email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]], token: [this.route.snapshot.queryParamMap.get('token') ?? '', Validators.required], newPassword: ['', [Validators.required, Validators.minLength(8)]], confirmPassword: ['', Validators.required] }, { validators: passwordsMatch });
  submit() {
    if (this.form.invalid) return;
    const v = this.form.getRawValue(); this.loading.set(true); this.message.set('');
    this.auth.resetPassword(v.email, v.token, v.newPassword).subscribe({
      next: res => { this.isError.set(false); this.message.set(res.message); this.loading.set(false); setTimeout(() => this.router.navigateByUrl('/login'), 900); },
      error: e => { this.isError.set(true); this.message.set(e.error?.message ?? 'Password reset failed.'); this.loading.set(false); }
    });
  }
}
