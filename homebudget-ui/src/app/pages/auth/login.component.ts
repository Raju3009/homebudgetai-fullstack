import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

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

  loading = signal(false);
  error = signal(this.route.snapshot.queryParamMap.get('expired') ? 'Your session expired. Please login again.' : '');
  showPassword = signal(false);

  form = this.fb.nonNullable.group({
    email: ['demo@homebudget.ai', [Validators.required, Validators.email]],
    password: ['Demo@12345', Validators.required],
    rememberMe: [true]
  });

  togglePassword() { this.showPassword.update(value => !value); }

  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading.set(true);
    this.error.set('');
    const value = this.form.getRawValue();
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/app/dashboard';
    this.auth.login(value.email, value.password, value.rememberMe).subscribe({
      next: () => this.router.navigateByUrl(returnUrl),
      error: error => { this.error.set(error.error?.message || 'Login failed. Check your credentials and try again.'); this.loading.set(false); }
    });
  }
}
