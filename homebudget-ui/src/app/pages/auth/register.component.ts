import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  return control.get('password')?.value === control.get('confirmPassword')?.value ? null : { mismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  error = signal('');
  step = signal(1);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    currency: ['INR'],
    monthlyGoal: [1200, [Validators.required, Validators.min(1)]],
    rememberMe: [true]
  }, { validators: passwordsMatch });

 strength = computed(() => {

  const password =
    this.form.controls.password.value || '';

  let score = 0;

  if (password.length >= 8)
    score++;

  if (/[A-Z]/.test(password))
    score++;

  if (/[0-9]/.test(password))
    score++;

  if (/[^A-Za-z0-9]/.test(password))
    score++;

  return score;
});

 strengthLabel = computed(() => {

  const score =
    this.strength();

  if (score <= 1)
    return 'Weak';

  if (score === 2)
    return 'Fair';

  if (score === 3)
    return 'Good';

  return 'Strong';
});

  next() {
    this.form.controls.fullName.markAsTouched();
    this.form.controls.email.markAsTouched();
    if (this.form.controls.fullName.invalid || this.form.controls.email.invalid) return;
    this.step.set(2);
  }

  togglePassword() { this.showPassword.update(value => !value); }
  toggleConfirmPassword() { this.showConfirmPassword.update(value => !value); }

 submit() {

  if (this.form.invalid) {

    this.form.markAllAsTouched();

    return;
  }

  const value =
    this.form.getRawValue();

  this.loading.set(true);

  this.error.set('');

  this.auth.register({

    fullName: value.fullName,

    email: value.email,

    password: value.password

  }).subscribe({

    next: () => {

      this.loading.set(false);

      this.router.navigateByUrl(
        '/app/dashboard'
      );
    },

    error: error => {

      this.error.set(

        error.error?.message ||

        'Registration failed.'
      );

      this.loading.set(false);
    }
  });
}}
