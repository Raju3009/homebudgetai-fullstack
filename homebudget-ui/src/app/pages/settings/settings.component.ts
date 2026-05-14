import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({ standalone: true, imports: [CommonModule, ReactiveFormsModule], template: `
<section class="workspace premium-page">
  <form class="panel editor" [formGroup]="form" (ngSubmit)="save()"><div class="section-head"><div><h2>Settings</h2><p>Theme, currency, language, notifications, and security preferences.</p></div><span class="badge">Enterprise controls</span></div><label>Theme<select formControlName="theme"><option>system</option><option>light</option><option>dark</option></select></label><label>Currency<select formControlName="currency"><option>USD</option><option>INR</option><option>EUR</option><option>GBP</option></select></label><label>Language<select formControlName="language"><option>en</option><option>hi</option><option>es</option><option>fr</option></select></label><label class="inline-check"><input type="checkbox" formControlName="emailNotifications"> Email notifications</label><label class="inline-check"><input type="checkbox" formControlName="pushNotifications"> Push notifications</label><label class="inline-check"><input type="checkbox" formControlName="monthlyDigest"> Monthly digest</label><button class="btn-primary">Save settings</button><p class="success" *ngIf="message()">{{ message() }}</p></form>
  <section class="panel"><div class="section-head"><div><h2>Security posture</h2><p>JWT sessions, role-based authorization, refresh token support, rate limiting, and secure API defaults.</p></div></div><div class="category-row"><span>Protected routes</span><strong class="success">Active</strong></div><div class="category-row"><span>Token expiration</span><strong class="success">Enabled</strong></div><div class="category-row"><span>API rate limiting</span><strong class="success">Enabled</strong></div></section>
</section>` })
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder); private api = inject(ApiService); message = signal('');
  form = this.fb.nonNullable.group({ theme: ['system'], currency: ['USD'], language: ['en'], emailNotifications: [true], pushNotifications: [true], monthlyDigest: [true] });
  ngOnInit() { this.api.settings().subscribe(x => this.form.patchValue(x)); }
  save() { this.api.updateSettings(this.form.getRawValue()).subscribe(x => { this.form.patchValue(x); this.message.set('Settings saved.'); }); }
}
