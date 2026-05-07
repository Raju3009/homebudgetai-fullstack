import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule], template: `
<section class="workspace profile-grid">
  <form class="panel" [formGroup]="profileForm" (ngSubmit)="saveProfile()"><div class="section-head"><h2>Profile</h2><p>Update account identity and image URL</p></div><label>Full name<input formControlName="fullName"></label><label>Email<input formControlName="email" readonly></label><label>Avatar URL<input formControlName="avatarUrl"></label><button [disabled]="profileForm.invalid">Save profile</button><p class="success" *ngIf="message()">{{ message() }}</p></form>
  <form class="panel" [formGroup]="passwordForm" (ngSubmit)="changePassword()"><div class="section-head"><h2>Password</h2><p>Keep credentials fresh and secure</p></div><label>Current password<input type="password" formControlName="currentPassword"></label><label>New password<input type="password" formControlName="newPassword"></label><button [disabled]="passwordForm.invalid">Change password</button></form>
</section>` })
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder); private api = inject(ApiService);
  message = signal('');
  profileForm = this.fb.nonNullable.group({ fullName: ['', Validators.required], email: [''], avatarUrl: [''] });
  passwordForm = this.fb.nonNullable.group({ currentPassword: ['', Validators.required], newPassword: ['', [Validators.required, Validators.minLength(8)]] });
  ngOnInit() { this.api.me().subscribe(p => this.profileForm.patchValue({ ...p, avatarUrl: p.avatarUrl ?? '' })); }
  saveProfile() { this.api.updateProfile(this.profileForm.getRawValue()).subscribe(p => { this.profileForm.patchValue({ ...p, avatarUrl: p.avatarUrl ?? '' }); this.message.set('Profile updated.'); }); }
  changePassword() { const v = this.passwordForm.getRawValue(); this.api.changePassword(v.currentPassword, v.newPassword).subscribe(() => { this.passwordForm.reset(); this.message.set('Password changed.'); }); }
}
