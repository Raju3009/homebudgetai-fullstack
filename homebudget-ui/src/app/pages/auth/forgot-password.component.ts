import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], template: `
<section class="auth-page"><form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
  <h1>Reset access</h1><p>Request a reset token for the demo mail flow.</p><label>Email<input formControlName="email" type="email" autocomplete="email"></label>
  <button [disabled]="form.invalid || loading()">{{ loading() ? 'Sending...' : 'Send reset link' }}</button>
  <p *ngIf="message()" class="success">{{ message() }}</p>
  <a *ngIf="resetLink()" [routerLink]="resetLink()">Continue to reset password</a>
  <a routerLink="/login">Back to login</a>
</form></section>` })
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder); private auth = inject(AuthService);
  loading = signal(false); message = signal(''); resetLink = signal<string | null>(null);
  form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  submit() {
    if (this.form.invalid) return;
    const email = this.form.getRawValue().email;
    this.loading.set(true); this.resetLink.set(null);
    this.auth.forgotPassword(email).subscribe({
      next: res => { this.message.set(res.resetToken ? `${res.message} Token: ${res.resetToken}` : res.message); if (res.resetToken) this.resetLink.set(`/reset-password?email=${encodeURIComponent(email)}&token=${encodeURIComponent(res.resetToken)}`); this.loading.set(false); },
      error: e => { this.message.set(e.error?.message ?? 'Unable to request reset.'); this.loading.set(false); }
    });
  }
}
