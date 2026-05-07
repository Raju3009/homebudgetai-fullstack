import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule, RouterLink], template: `
<section class="auth-page"><form class="auth-card" [formGroup]="form" (ngSubmit)="submit()">
  <h1>Reset access</h1><p>Request a reset token for the demo mail flow.</p><label>Email<input formControlName="email" type="email"></label>
  <button [disabled]="form.invalid">Send reset link</button><p *ngIf="message()" class="success">{{ message() }}</p><a routerLink="/login">Back to login</a>
</form></section>` })
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder); private auth = inject(AuthService);
  message = signal(''); form = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email]] });
  submit() { this.auth.forgotPassword(this.form.getRawValue().email).subscribe(res => this.message.set(res.resetToken ? `${res.message} Token: ${res.resetToken}` : res.message)); }
}
