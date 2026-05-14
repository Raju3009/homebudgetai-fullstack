import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService, NotificationItem } from '../../services/api.service';

@Component({ standalone: true, imports: [CommonModule], template: `
<section class="premium-page page-grid">
  <article class="metric"><span>Unread alerts</span><strong>{{ unread }}</strong><small class="badge success">Real-time style center</small></article>
  <article class="metric"><span>Activity events</span><strong>{{ items.length }}</strong><small>Budget, report, and security updates</small></article>
  <section class="panel full"><div class="section-head"><div><h2>Notification center</h2><p>Animated alerts, unread badges, and recent activity timeline.</p></div><button class="btn-secondary" (click)="load()">Refresh</button></div><div class="empty-state" *ngIf="!loading() && items.length === 0">No notifications yet.</div><div class="activity-row" *ngFor="let item of items"><div><strong>{{ item.title }}</strong><p class="muted">{{ item.message }}</p><small>{{ item.createdAt | date:'medium' }}</small></div><button class="btn-secondary" [disabled]="item.isRead" (click)="markRead(item)">{{ item.isRead ? 'Read' : 'Mark read' }}</button></div></section>
</section>` })
export class ActivityComponent implements OnInit {
  private api = inject(ApiService); items: NotificationItem[] = []; loading = signal(false);
  get unread() { return this.items.filter(x => !x.isRead).length; }
  ngOnInit() { this.load(); }
  load() { this.loading.set(true); this.api.notifications().subscribe({ next: x => { this.items = x; this.loading.set(false); }, error: () => this.loading.set(false) }); }
  markRead(item: NotificationItem) { this.api.markNotificationRead(item.id).subscribe(() => { item.isRead = true; }); }
}
