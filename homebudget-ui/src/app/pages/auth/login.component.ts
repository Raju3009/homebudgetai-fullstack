import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { ToastService } from '../../shared/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toast = inject(ToastService);

  readonly quotes = [
    { headline: 'Take control of your finances.', detail: 'See cash flow, budgets, and savings signals in one calm workspace.' },
    { headline: 'Track smarter. Save faster.', detail: 'Turn every transaction into a better decision for the next month.' },
    { headline: 'Your AI-powered budgeting assistant.', detail: 'Spot overspending early and get practical actions before it hurts.' }
  ];

  loading = signal(false);
  redirecting = signal(false);
  error = signal(this.route.snapshot.queryParamMap.get('expired') ? 'Your session expired. Please login again.' : '');
  showPassword = signal(false);
  quoteIndex = signal(0);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
    rememberMe: [true]
  });

  activeQuote() {
    return this.quotes[this.quoteIndex()];
  }

  togglePassword(): void {
    this.showPassword.update(value => !value);
  }

  submit(): void {
    if (this.loading()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Please complete all required fields.');
      this.toast.warning('Please enter a valid email and password.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const value = this.form.getRawValue();

    this.auth.login({ email: value.email, password: value.password }).subscribe({
      next: () => {
        this.redirecting.set(true);
        this.toast.success('Welcome back. Your dashboard is ready.');
        window.setTimeout(() => {
          this.loading.set(false);
          this.router.navigate(['/app/dashboard']);
        }, 700);
      },
      error: error => {
        this.error.set(error.error?.message || 'Login failed. Check your credentials and try again.');
        this.toast.error(this.error());
        this.loading.set(false);
      }
    });
  }
}
