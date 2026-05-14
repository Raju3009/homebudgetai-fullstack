import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  return control.get('newPassword')?.value === control.get('confirmPassword')?.value ? null : { mismatch: true };
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<section class="auth-page premium-page">
  <div class="auth-visual"><div class="auth-copy"><span class="badge success">Verified reset</span><h1>Set a stronger password and continue securely.</h1><p>The reset flow validates email, token, matching passwords, and redirects back to login after success.</p></div></div>
  <div class="auth-card-wrap">
    <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
      <div><span class="badge">Security checkpoint</span><h2>Reset password</h2><p>Paste the reset token generated from the recovery flow.</p></div>
      <label>Email<input formControlName="email" type="email" autocomplete="email"></label>
      <label>Reset token<input formControlName="token" autocomplete="one-time-code"></label>
      <label>New password<input formControlName="newPassword" type="password" autocomplete="new-password"></label>
      <label>Confirm password<input formControlName="confirmPassword" type="password" autocomplete="new-password"></label>
      <p class="error" *ngIf="form.hasError('mismatch') && form.touched">Passwords do not match.</p>
      <button class="btn-primary" [disabled]="form.invalid || loading()">{{ loading() ? 'Resetting...' : 'Reset password' }}</button>
      <p [class.error]="isError()" [class.success]="!isError()" *ngIf="message()">{{ message() }}</p>
      <a routerLink="/login">Back to login</a>
    </form>
  </div>
</section>`
})
export class ResetPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  loading = signal(false);
  message = signal('');
  isError = signal(false);
  form = this.fb.nonNullable.group({
    email: [this.route.snapshot.queryParamMap.get('email') ?? '', [Validators.required, Validators.email]],
    token: [this.route.snapshot.queryParamMap.get('token') ?? '', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordsMatch });

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const value = this.form.getRawValue();
    this.loading.set(true);
    this.message.set('');
    this.auth.resetPassword(value.email, value.token, value.newPassword).subscribe({
      next: response => { this.isError.set(false); this.message.set(response.message); this.loading.set(false); setTimeout(() => this.router.navigateByUrl('/login'), 900); },
      error: error => { this.isError.set(true); this.message.set(error.error?.message ?? 'Password reset failed.'); this.loading.set(false); }
    });
  }
}
