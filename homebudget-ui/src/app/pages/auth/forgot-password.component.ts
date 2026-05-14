import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<section class="auth-page premium-page">
  <div class="auth-visual"><div class="auth-copy"><span class="badge success">Secure recovery</span><h1>Recover access without losing momentum.</h1><p>The demo flow generates a reset token so the full password recovery journey can be tested end to end.</p></div></div>
  <div class="auth-card-wrap">
    <form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
      <div><span class="badge">OTP style reset</span><h2>Forgot password</h2><p>Enter your email to generate a demo reset token.</p></div>
      <label>Email address<input formControlName="email" type="email" autocomplete="email"></label>
      <button class="btn-primary" [disabled]="form.invalid || loading()">{{ loading() ? 'Sending...' : 'Send reset token' }}</button>
      <p *ngIf="message()" class="success">{{ message() }}</p>
      <a *ngIf="resetLink()" class="btn-secondary" [routerLink]="resetLink()">Continue to reset password</a>
      <a routerLink="/login">Back to login</a>
    </form>
  </div>
</section>`
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  loading = signal(false);
  message = signal('');
  resetLink = signal<string | null>(null);
  form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });

  submit() {
    if (this.form.invalid) return;
    const email = this.form.getRawValue().email;
    this.loading.set(true);
    this.resetLink.set(null);
    this.auth.forgotPassword(email).subscribe({
      next: response => {
        this.message.set(response.resetToken ? `${response.message} Token: ${response.resetToken}` : response.message);
        if (response.resetToken) this.resetLink.set(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(response.resetToken)}`);
        this.loading.set(false);
      },
      error: error => { this.message.set(error.error?.message ?? 'Unable to request reset.'); this.loading.set(false); }
    });
  }
}
