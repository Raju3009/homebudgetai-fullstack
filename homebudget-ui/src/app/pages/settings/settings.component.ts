import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  message = signal('');
  error = signal('');
  loading = signal(true);
  saving = signal(false);

  form = this.fb.nonNullable.group({
    theme: ['system', Validators.required],
    currency: ['INR', Validators.required],
    language: ['en', Validators.required],
    emailNotifications: [true],
    pushNotifications: [true],
    monthlyDigest: [true]
  });

  ngOnInit() {
    this.api.settings().subscribe({
      next: settings => {
        this.form.patchValue(settings);
        this.applyTheme(settings.theme);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load settings. Demo defaults are ready to use.');
        this.loading.set(false);
      }
    });
  }

  save() {
    if (this.form.invalid || this.saving()) {
      this.form.markAllAsTouched();
      return;
    }

    this.message.set('');
    this.error.set('');
    this.saving.set(true);

    this.api.updateSettings(this.form.getRawValue()).subscribe({
      next: settings => {
        this.form.patchValue(settings);
        this.applyTheme(settings.theme);
        this.message.set('Settings saved successfully.');
        this.saving.set(false);
      },
      error: () => {
        this.error.set('Settings could not be saved. Please try again.');
        this.saving.set(false);
      }
    });
  }

  private applyTheme(theme: string) {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const dark = theme === 'dark' || (theme === 'system' && prefersDark);
    localStorage.setItem('homebudgetai.theme', dark ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent('homebudgetai-theme', { detail: { dark } }));
  }
}
