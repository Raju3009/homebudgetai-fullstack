import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { ToastService } from '../../shared/toast.service';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
  return control.get('newPassword')?.value === control.get('confirmPassword')?.value ? null : { mismatch: true };
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private toast = inject(ToastService);

  loading = signal(true);
  profileLoading = signal(true);
  savingProfile = signal(false);
  savingPreferences = signal(false);
  savingSecurity = signal(false);
  savingWorkspace = signal(false);
  lastSaved = signal('');
  error = signal('');

  profileForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
    avatarUrl: ['']
  });

  preferencesForm = this.fb.nonNullable.group({
    theme: ['system', Validators.required],
    currency: ['INR', Validators.required],
    language: ['en', Validators.required],
    emailNotifications: [true],
    pushNotifications: [true],
    monthlyDigest: [true]
  });

  securityForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required],
    twoFactor: [false]
  }, { validators: passwordsMatch });

  workspaceForm = this.fb.nonNullable.group({
    workspaceName: [localStorage.getItem('homebudgetai.workspace') || 'HomeBudgetAI Workspace', Validators.required],
    workspaceType: ['Personal Finance', Validators.required]
  });

  ngOnInit(): void {
    this.api.settings().subscribe({
      next: settings => {
        this.preferencesForm.patchValue(settings);
        this.applyTheme(settings.theme);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load settings. Demo defaults are ready to use.');
        this.toast.warning(this.error());
        this.loading.set(false);
      }
    });

    this.api.me().subscribe({
      next: profile => {
        this.profileForm.patchValue({ fullName: profile.fullName, email: profile.email, avatarUrl: profile.avatarUrl ?? '' });
        this.profileLoading.set(false);
      },
      error: () => {
        this.profileLoading.set(false);
        this.toast.warning('Profile details could not be loaded.');
      }
    });
  }

  saveProfile(): void {
    if (this.profileForm.invalid || this.savingProfile()) {
      this.profileForm.markAllAsTouched();
      this.toast.warning('Please complete your profile name.');
      return;
    }

    this.savingProfile.set(true);
    const value = this.profileForm.getRawValue();
    this.api.updateProfile({ fullName: value.fullName, avatarUrl: value.avatarUrl }).subscribe({
      next: () => { this.saved('Profile saved.'); this.savingProfile.set(false); },
      error: () => { this.toast.error('Profile could not be saved.'); this.savingProfile.set(false); }
    });
  }

  savePreferences(): void {
    if (this.preferencesForm.invalid || this.savingPreferences()) {
      this.preferencesForm.markAllAsTouched();
      this.toast.warning('Please complete preference settings.');
      return;
    }

    this.savingPreferences.set(true);
    this.api.updateSettings(this.preferencesForm.getRawValue()).subscribe({
      next: settings => {
        this.preferencesForm.patchValue(settings);
        this.applyTheme(settings.theme);
        this.saved('Preferences saved.');
        this.savingPreferences.set(false);
      },
      error: () => { this.toast.error('Settings could not be saved.'); this.savingPreferences.set(false); }
    });
  }

  changePassword(): void {
    if (this.securityForm.invalid || this.savingSecurity()) {
      this.securityForm.markAllAsTouched();
      this.toast.warning(this.securityForm.hasError('mismatch') ? 'Passwords do not match.' : 'Please complete all security fields.');
      return;
    }

    const value = this.securityForm.getRawValue();
    this.savingSecurity.set(true);
    this.api.changePassword(value.currentPassword, value.newPassword).subscribe({
      next: () => {
        this.securityForm.reset({ currentPassword: '', newPassword: '', confirmPassword: '', twoFactor: value.twoFactor });
        this.saved('Password changed securely.');
        this.savingSecurity.set(false);
      },
      error: () => { this.toast.error('Password could not be changed.'); this.savingSecurity.set(false); }
    });
  }

  saveWorkspace(): void {
    if (this.workspaceForm.invalid || this.savingWorkspace()) {
      this.workspaceForm.markAllAsTouched();
      this.toast.warning('Please enter workspace name.');
      return;
    }

    this.savingWorkspace.set(true);
    const value = this.workspaceForm.getRawValue();
    localStorage.setItem('homebudgetai.workspace', value.workspaceName);
    window.setTimeout(() => {
      this.saved('Workspace updated.');
      this.savingWorkspace.set(false);
    }, 350);
  }

  private saved(message: string): void {
    this.lastSaved.set(message);
    this.toast.success(message);
    window.setTimeout(() => this.lastSaved.set(''), 3200);
  }

  private applyTheme(theme: string): void {
    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const dark = theme === 'dark' || (theme === 'system' && prefersDark);
    localStorage.setItem('homebudgetai.theme', dark ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent('homebudgetai-theme', { detail: { dark } }));
  }
}
