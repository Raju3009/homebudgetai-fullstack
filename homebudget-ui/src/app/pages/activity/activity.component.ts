import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ApiService, NotificationItem } from '../../services/api.service';
import { ToastService } from '../../shared/toast.service';

interface ActivityView extends NotificationItem {
  action: string;
  category: string;
  icon: string;
  group: string;
}

@Component({
  standalone: true,
  imports: [CommonModule],
  template: `
<section class="premium-page activity-page page-grid">
  <article class="metric"><span>Unread alerts</span><strong>{{ unread }}</strong><small class="badge success">Needs review</small></article>
  <article class="metric"><span>Activity events</span><strong>{{ items.length }}</strong><small>Budget, income, expense, and AI updates</small></article>
  <article class="metric"><span>This week</span><strong>{{ thisWeekCount() }}</strong><small>Recent workspace movement</small></article>

  <section class="panel full activity-panel">
    <div class="section-head">
      <div><h2>Activity Timeline</h2><p>Grouped by Today, Yesterday, and This Week for faster scanning.</p></div>
      <button class="btn-secondary" type="button" (click)="load()">Refresh</button>
    </div>

    <div class="empty-state activity-empty" *ngIf="!loading() && items.length === 0">
      <div class="activity-empty-icon">AI</div>
      No activity yet. Add expenses, budgets, income, or goals to build your timeline.
    </div>

    <div class="activity-groups" *ngIf="items.length > 0">
      <section class="activity-group" *ngFor="let group of groupedActivities()">
        <h3>{{ group.label }}</h3>
        <article class="activity-card" *ngFor="let item of group.items" [class.unread]="!item.isRead">
          <div class="activity-icon">{{ item.icon }}</div>
          <div class="activity-main">
            <div class="activity-title">
              <strong>{{ item.action }}</strong>
              <span>{{ item.category }}</span>
            </div>
            <p>{{ item.message }}</p>
            <small>{{ item.createdAt | date:'shortTime' }} | {{ item.createdAt | date:'mediumDate' }}</small>
          </div>
          <button class="btn-secondary" type="button" [disabled]="item.isRead" (click)="markRead(item)">{{ item.isRead ? 'Read' : 'Mark read' }}</button>
        </article>
      </section>
    </div>
  </section>
</section>
`,
  styles: [`
    :host { display: block; }
    .activity-page .metric { grid-column: span 4; }
    .activity-panel { display: grid; gap: 1rem; }
    .activity-groups { display: grid; gap: 1rem; }
    .activity-group { display: grid; gap: .75rem; }
    .activity-group h3 { margin: 0; color: var(--muted); font-size: .86rem; text-transform: uppercase; letter-spacing: .04em; }
    .activity-card { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: 1rem; border: 1px solid var(--line); border-radius: 18px; padding: 1rem; background: rgba(255,255,255,.6); box-shadow: var(--soft-shadow); transition: transform .2s ease, border-color .2s ease, background .2s ease; }
    .dark-mode .activity-card { background: rgba(13,27,24,.58); }
    .activity-card:hover { transform: translateY(-3px); border-color: rgba(15,118,110,.24); }
    .activity-card.unread { background: linear-gradient(135deg, rgba(15,118,110,.12), rgba(37,99,235,.08)), rgba(255,255,255,.72); }
    .activity-icon { width: 46px; height: 46px; display: grid; place-items: center; border-radius: 16px; color: #fff; background: linear-gradient(135deg, var(--brand), var(--brand-2)); font-weight: 900; }
    .activity-main { display: grid; gap: .28rem; min-width: 0; }
    .activity-title { display: flex; align-items: center; justify-content: space-between; gap: .75rem; flex-wrap: wrap; }
    .activity-title span { border-radius: 999px; padding: .28rem .55rem; color: #0f766e; background: rgba(15,118,110,.1); font-size: .78rem; font-weight: 900; }
    .activity-main p { margin: 0; color: var(--muted); line-height: 1.5; }
    .activity-empty { display: grid; place-items: center; gap: .55rem; min-height: 260px; }
    .activity-empty-icon { width: 72px; height: 72px; display: grid; place-items: center; border-radius: 24px; color: #fff; background: linear-gradient(135deg, var(--brand), var(--brand-2)); font-weight: 900; }
    @media (max-width: 1180px) { .activity-page .metric { grid-column: span 12; } }
    @media (max-width: 720px) { .activity-card { grid-template-columns: 1fr; } .activity-card button { width: 100%; } }
  `]
})
export class ActivityComponent implements OnInit {
  private api = inject(ApiService);
  private toast = inject(ToastService);

  items: NotificationItem[] = [];
  loading = signal(false);

  get unread(): number { return this.items.filter(item => !item.isRead).length; }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.api.notifications().subscribe({
      next: items => {
        this.items = items;
        this.loading.set(false);
        if (items.length > 0) this.toast.info('Activity timeline refreshed.');
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Activity could not be loaded.');
      }
    });
  }

  markRead(item: NotificationItem): void {
    this.api.markNotificationRead(item.id).subscribe({
      next: () => { item.isRead = true; this.toast.success('Activity marked as read.'); },
      error: () => this.toast.error('Could not update activity status.')
    });
  }

  groupedActivities(): { label: string; items: ActivityView[] }[] {
    const views = this.items.map(item => this.toActivity(item));
    const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
    return order
      .map(label => ({ label, items: views.filter(item => item.group === label) }))
      .filter(group => group.items.length > 0);
  }

  thisWeekCount(): number {
    return this.items.map(item => this.toActivity(item)).filter(item => item.group === 'Today' || item.group === 'Yesterday' || item.group === 'This Week').length;
  }

  private toActivity(item: NotificationItem): ActivityView {
    const title = `${item.title} ${item.message}`.toLowerCase();
    let action = 'Workspace Activity';
    let category = item.type || 'General';
    let icon = 'HB';

    if (title.includes('expense')) { action = 'Expense Added'; category = 'Expense'; icon = '-'; }
    else if (title.includes('income')) { action = 'Income Added'; category = 'Income'; icon = '+'; }
    else if (title.includes('budget')) { action = 'Budget Updated'; category = 'Budget'; icon = 'B'; }
    else if (title.includes('goal')) { action = 'Goal Achieved'; category = 'Goal'; icon = 'G'; }
    else if (title.includes('insight') || title.includes('ai')) { action = 'AI Insight Generated'; category = 'AI'; icon = 'AI'; }
    else if (title.includes('report')) { action = 'Report Generated'; category = 'Report'; icon = 'R'; }

    return { ...item, action, category, icon, group: this.groupFor(item.createdAt) };
  }

  private groupFor(value: string): string {
    const date = new Date(value);
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startYesterday = new Date(startToday);
    startYesterday.setDate(startToday.getDate() - 1);
    const startWeek = new Date(startToday);
    startWeek.setDate(startToday.getDate() - 7);

    if (date >= startToday) return 'Today';
    if (date >= startYesterday) return 'Yesterday';
    if (date >= startWeek) return 'This Week';
    return 'Earlier';
  }
}
