import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';

import { RouterLink } from '@angular/router';

import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,

  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink
  ],

  template: `
<section class="auth-page premium-page">

  <div class="auth-visual">

    <div class="auth-copy">

      <span class="badge success">
        Secure recovery
      </span>

      <h1>
        Recover access without losing momentum.
      </h1>

      <p>
        Generate a secure reset token and continue
        your recovery flow safely.
      </p>

    </div>

  </div>

  <div class="auth-card-wrap">

    <form
      class="auth-card"
      [formGroup]="form"
      (ngSubmit)="submit()"
    >

      <div>

        <span class="badge">
          OTP style reset
        </span>

        <h2>
          Forgot Password
        </h2>

        <p>
          Enter your email to generate a reset token.
        </p>

      </div>

      <label>

        <span>Email Address</span>

        <input
          formControlName="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
        >

      </label>

      <button
        class="btn-primary"
        [disabled]="form.invalid || loading()"
      >

        {{
          loading()
          ? 'Sending...'
          : 'Send Reset Token'
        }}

      </button>

      <p
        *ngIf="message()"
        class="success"
      >
        {{ message() }}
      </p>

      <a
        *ngIf="resetLink()"
        class="btn-secondary"
        [routerLink]="resetLink()"
      >
        Continue to Reset Password
      </a>

      <a routerLink="/login">
        Back to login
      </a>

    </form>

  </div>

</section>
`
})
export class ForgotPasswordComponent {

  private fb = inject(FormBuilder);

  private auth = inject(AuthService);

  loading = signal(false);

  message = signal('');

  resetLink = signal<string | null>(null);

  form = this.fb.nonNullable.group({

    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ]
  });

  submit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    const email =
      this.form.getRawValue().email;

    this.loading.set(true);

    this.resetLink.set(null);

    this.auth.forgotPassword(email).subscribe({

      next: response => {

        if (response.resetToken) {

          this.message.set(
            response.message +
            ' Token: ' +
            response.resetToken
          );

          this.resetLink.set(
            '/reset-password?email=' +
            encodeURIComponent(email) +
            '&token=' +
            encodeURIComponent(response.resetToken)
          );

        } else {

          this.message.set(response.message);
        }

        this.loading.set(false);
      },

      error: error => {

        this.message.set(
          error.error?.message ??
          'Unable to request reset.'
        );

        this.loading.set(false);
      }
    });
  }
}