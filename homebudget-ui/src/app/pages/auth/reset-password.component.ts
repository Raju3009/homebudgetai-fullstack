import { CommonModule } from '@angular/common';

import {
  Component,
  inject,
  signal
} from '@angular/core';

import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink
} from '@angular/router';

import { AuthService } from '../../core/auth.service';

function passwordsMatch(
  control: AbstractControl
): ValidationErrors | null {

  return control.get('newPassword')?.value ===
    control.get('confirmPassword')?.value
    ? null
    : { mismatch: true };
}

@Component({
  selector: 'app-reset-password',

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
        Verified reset
      </span>

      <h1>
        Set a stronger password securely.
      </h1>

      <p>
        Reset your credentials and continue
        safely to your financial dashboard.
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
          Security checkpoint
        </span>

        <h2>
          Reset Password
        </h2>

        <p>
          Enter your email, token,
          and new password.
        </p>

      </div>

      <label>

        <span>Email</span>

        <input
          formControlName="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
        >

      </label>

      <label>

        <span>Reset Token</span>

        <input
          formControlName="token"
          autocomplete="one-time-code"
          placeholder="Enter reset token"
        >

      </label>

      <label>

        <span>New Password</span>

        <input
          formControlName="newPassword"
          [type]="showPassword() ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="Create password"
        >

      </label>

      <label>

        <span>Confirm Password</span>

        <input
          formControlName="confirmPassword"
          [type]="showPassword() ? 'text' : 'password'"
          autocomplete="new-password"
          placeholder="Confirm password"
        >

      </label>

      <button
        type="button"
        class="btn-secondary"
        (click)="togglePassword()"
      >

        {{
          showPassword()
          ? 'Hide Passwords'
          : 'Show Passwords'
        }}

      </button>

      <small
        class="error"
        *ngIf="
          form.hasError('mismatch') &&
          form.touched
        "
      >
        Passwords do not match.
      </small>

      <button
        class="btn-primary"
        [disabled]="form.invalid || loading()"
      >

        {{
          loading()
          ? 'Resetting...'
          : 'Reset Password'
        }}

      </button>

      <p
        *ngIf="message()"
        [class.error]="isError()"
        [class.success]="!isError()"
      >
        {{ message() }}
      </p>

      <a routerLink="/login">
        Back to login
      </a>

    </form>

  </div>

</section>
`
})
export class ResetPasswordComponent {

  private fb = inject(FormBuilder);

  private auth = inject(AuthService);

  private route = inject(ActivatedRoute);

  private router = inject(Router);

  loading = signal(false);

  message = signal('');

  isError = signal(false);

  showPassword = signal(false);

  form = this.fb.nonNullable.group({

    email: [
      this.route.snapshot.queryParamMap.get('email') ?? '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    token: [
      this.route.snapshot.queryParamMap.get('token') ?? '',
      Validators.required
    ],

    newPassword: [
      '',
      [
        Validators.required,
        Validators.minLength(8)
      ]
    ],

    confirmPassword: [
      '',
      Validators.required
    ]

  }, {
    validators: passwordsMatch
  });

  togglePassword(): void {

    this.showPassword.update(
      value => !value
    );
  }

  submit(): void {

    if (this.form.invalid) {

      this.form.markAllAsTouched();

      return;
    }

    const value =
      this.form.getRawValue();

    this.loading.set(true);

    this.message.set('');

    this.auth.resetPassword({

      Email: value.email,

      Token: value.token,

      Password: value.newPassword

    }).subscribe({

      next: response => {

        this.isError.set(false);

        this.message.set(
          response.message
        );

        this.loading.set(false);

        setTimeout(() => {

          this.router.navigateByUrl(
            '/login'
          );

        }, 1200);
      },

      error: error => {

        this.isError.set(true);

        this.message.set(

          error.error?.message ??

          'Password reset failed.'
        );

        this.loading.set(false);
      }
    });
  }
}