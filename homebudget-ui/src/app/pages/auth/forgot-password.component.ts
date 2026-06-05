import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
<section class="auth-page premium-page forgot-page">
  <div class="auth-visual forgot-visual">
    <div class="auth-copy">
      <span class="badge success">Secure recovery</span>
      <h1>Reset access without losing momentum.</h1>
      <p>Enter your account email and HomeBudgetAI will prepare a secure reset flow for your workspace.</p>
      <div class="recovery-steps">
        <span>Email verified</span>
        <span>Reset link prepared</span>
        <span>New password secured</span>
      </div>
    </div>
  </div>

  <div class="auth-card-wrap">
    <form class="auth-card forgot-card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
      <div class="auth-header">
        <span class="badge">Password recovery</span>
        <h2>Forgot Password</h2>
        <p>We will send reset instructions if the email exists in your workspace.</p>
      </div>

      <div class="mail-animation" *ngIf="sent()" aria-live="polite">
        <span>@</span>
        <strong>Email sent</strong>
        <small>{{ message() }}</small>
      </div>

      <label>
        Email Address
        <input formControlName="email" type="email" autocomplete="email" placeholder="you@example.com">
        <small class="field-error" *ngIf="form.controls.email.touched && form.controls.email.invalid">
          {{ form.controls.email.hasError('required') ? 'Please enter email' : 'Please enter a valid email address' }}
        </small>
      </label>

      <button class="btn-primary recover-btn" type="submit" [disabled]="loading()">
        <span class="button-spinner" *ngIf="loading()"></span>
        <span>{{ loading() ? 'Sending...' : 'Send reset instructions' }}</span>
      </button>

      <a *ngIf="resetLink()" class="btn-secondary" [routerLink]="resetLink()">Continue to Reset Password</a>
      <a routerLink="/login">Back to Login</a>
    </form>
  </div>
</section>
`,
  styles: [`
    :host { display: block; }
    .forgot-page { background: #071311; }
    .forgot-visual { background: radial-gradient(circle at 20% 20%, rgba(45, 212, 191, 0.24), transparent 34%), linear-gradient(135deg, #061311, #0f3d36 50%, #101827); }
    .recovery-steps { display: grid; gap: 0.75rem; max-width: 460px; }
    .recovery-steps span { border: 1px solid rgba(255,255,255,.16); border-radius: 16px; padding: 0.85rem 1rem; color: rgba(255,255,255,.84); background: rgba(255,255,255,.1); backdrop-filter: blur(14px); animation: fadeUp 0.5s ease both; }
    .recovery-steps span:nth-child(2) { animation-delay: 0.08s; }
    .recovery-steps span:nth-child(3) { animation-delay: 0.16s; }
    .forgot-card { max-width: 460px; }
    .mail-animation { display: grid; place-items: center; gap: 0.35rem; border: 1px solid rgba(37, 99, 235, 0.18); border-radius: 18px; padding: 1rem; text-align: center; color: #1d4ed8; background: rgba(37, 99, 235, 0.1); animation: mailPop 0.38s ease both; }
    .mail-animation span { width: 50px; height: 50px; display: grid; place-items: center; border-radius: 16px; color: #fff; background: linear-gradient(135deg, #0f766e, #2563eb); font-weight: 900; font-size: 1.4rem; }
    .mail-animation small { color: var(--muted); }
    .field-error { color: #dc2626; font-size: 0.82rem; font-weight: 800; }
    .recover-btn { width: 100%; min-height: 52px; }
    .button-spinner { width: 18px; height: 18px; border: 3px solid rgba(255,255,255,.35); border-top-color: #fff; border-radius: 999px; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes mailPop { from { opacity: 0; transform: translateY(8px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private toast = inject(ToastService);

  loading = signal(false);
  sent = signal(false);
  message = signal('');
  resetLink = signal<string | null>(null);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  submit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toast.warning('Please enter a valid email address');
      return;
    }

    const email = this.form.getRawValue().email;
    this.loading.set(true);
    this.sent.set(false);
    this.resetLink.set(null);

    this.auth.forgotPassword(email).subscribe({
      next: response => {
        this.message.set(response.message || 'Reset instructions have been sent.');
        this.sent.set(true);
        if (response.resetToken) {
          this.resetLink.set('/reset-password?email=' + encodeURIComponent(email) + '&token=' + encodeURIComponent(response.resetToken));
        }
        this.toast.success('Reset instructions sent.');
        this.loading.set(false);
      },
      error: error => {
        const message = error.error?.message ?? 'Unable to request reset. Please try again.';
        this.message.set(message);
        this.toast.error(message);
        this.loading.set(false);
      }
    });
  }
}
