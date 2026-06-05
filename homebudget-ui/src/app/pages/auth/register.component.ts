import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../shared/toast.service';

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
  private toast = inject(ToastService);

  loading = signal(false);
  success = signal(false);
  error = signal('');
  missingMessage = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  form = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    workspaceName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    confirmPassword: ['', Validators.required],
    currency: ['INR', Validators.required],
    monthlyGoal: [1200, [Validators.required, Validators.min(1)]],
    notifications: [true]
  }, { validators: passwordsMatch });

  strengthScore = computed(() => {
    const password = this.form.controls.password.value || '';
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  });

  strengthLabel = computed(() => {
    const score = this.strengthScore();
    if (score <= 2) return 'Weak';
    if (score <= 4) return 'Medium';
    return 'Strong';
  });

  strengthPercent = computed(() => Math.max(8, this.strengthScore() * 20));

  hasMinLength(): boolean { return this.form.controls.password.value.length >= 8; }

  hasUppercase(): boolean { return /[A-Z]/.test(this.form.controls.password.value); }

  hasLowercase(): boolean { return /[a-z]/.test(this.form.controls.password.value); }

  hasNumber(): boolean { return /[0-9]/.test(this.form.controls.password.value); }

  hasSpecialCharacter(): boolean { return /[^A-Za-z0-9]/.test(this.form.controls.password.value); }

  togglePassword(): void {
    this.showPassword.update(value => !value);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update(value => !value);
  }

  submit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      const message = this.validationSummary();
      this.missingMessage.set(message);
      this.toast.warning(message);
      return;
    }

    const value = this.form.getRawValue();
    this.loading.set(true);
    this.error.set('');
    this.missingMessage.set('');

    this.auth.register({ fullName: value.fullName, email: value.email, password: value.password }).subscribe({
      next: () => {
        localStorage.setItem('homebudgetai.workspace', value.workspaceName);
        this.success.set(true);
        this.toast.success('Workspace created. Redirecting to your dashboard.');
        window.setTimeout(() => {
          this.loading.set(false);
          this.router.navigateByUrl('/app/dashboard');
        }, 900);
      },
      error: error => {
        this.error.set(error.error?.message || 'Registration failed. Please try again.');
        this.toast.error(this.error());
        this.loading.set(false);
      }
    });
  }

  private validationSummary(): string {
    if (this.form.controls.email.hasError('required')) return 'Please enter email';
    if (this.form.controls.email.hasError('email')) return 'Please enter a valid email address';
    if (this.form.controls.password.hasError('required')) return 'Please enter your password';
    if (this.form.controls.workspaceName.hasError('required')) return 'Please enter workspace name';
    if (this.form.controls.fullName.hasError('required') || this.form.controls.confirmPassword.hasError('required') || this.form.controls.monthlyGoal.invalid) return 'Please complete all required fields';
    if (this.form.hasError('mismatch')) return 'Passwords do not match';
    return 'Please complete all required fields';
  }
}

