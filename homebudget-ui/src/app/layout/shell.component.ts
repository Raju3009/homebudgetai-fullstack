import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  Bell,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
  User,
  WalletCards,
  LucideAngularModule
} from 'lucide-angular';
import { AuthService } from '../core/auth.service';

const icons = {
  Bell,
  CreditCard,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
  Sun,
  Target,
  User,
  WalletCards
};

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
  <div class="app-shell" [class.collapsed]="collapsed()" [class.dark-mode]="dark()" [attr.data-theme]="dark() ? 'dark' : 'light'">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">HB</div>
        <div class="hide-when-collapsed">
          <strong>HomeBudgetAI</strong>
          <small>Fintech OS</small>
        </div>
      </div>

      <button class="sidebar-action" type="button" (click)="toggleCollapsed()" title="Toggle sidebar">
        <lucide-icon [name]="collapsed() ? 'PanelLeftOpen' : 'PanelLeftClose'" size="19"></lucide-icon>
        <span class="hide-when-collapsed">Collapse</span>
      </button>

      <nav aria-label="Primary navigation">
        <a *ngFor="let item of navItems" [routerLink]="item.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: item.exact ?? false }">
          <lucide-icon [name]="item.icon" size="19"></lucide-icon>
          <span class="hide-when-collapsed">{{ item.label }}</span>
        </a>
      </nav>

      <div class="panel ai-card hide-when-collapsed">
        <div class="section-head">
          <div>
            <h2>AI Pulse</h2>
            <p>Projected savings are trending up 12% this month.</p>
          </div>
        </div>
        <button class="btn-primary" routerLink="/app/reports"><lucide-icon name="Sparkles" size="16"></lucide-icon> View insight</button>
      </div>

      <div class="sidebar-footer">
        <button class="sidebar-action" type="button" (click)="toggleDark()">
          <lucide-icon [name]="dark() ? 'Sun' : 'Moon'" size="19"></lucide-icon>
          <span class="hide-when-collapsed">{{ dark() ? 'Light mode' : 'Dark mode' }}</span>
        </button>
        <div class="sidebar-user">
          <div class="avatar">{{ initials() }}</div>
          <div class="hide-when-collapsed">
            <strong>{{ auth.user()?.fullName || 'Demo User' }}</strong>
            <small>{{ auth.user()?.role || 'User' }} workspace</small>
          </div>
        </div>
      </div>
    </aside>

    <main class="shell-main">
      <header class="topbar">
        <div>
          <small>Financial command center</small>
          <h1>{{ pageTitle() }}</h1>
        </div>
        <div class="search-box" role="search">
          <lucide-icon name="Search" size="18"></lucide-icon>
          <span>Search transactions, budgets, reports...</span>
          <small>Ctrl K</small>
        </div>
        <div class="top-actions">
          <button class="icon-button" routerLink="/app/activity" title="Notifications"><lucide-icon name="Bell" size="19"></lucide-icon></button>
          <button class="icon-button" routerLink="/app/settings" title="Settings"><lucide-icon name="Settings" size="19"></lucide-icon></button>
          <button class="btn-secondary" routerLink="/app/profile"><lucide-icon name="User" size="17"></lucide-icon><span>Profile</span></button>
          <button class="btn-ghost" type="button" (click)="auth.logout()"><lucide-icon name="LogOut" size="17"></lucide-icon></button>
        </div>
      </header>

      <div class="content-area">
        <router-outlet></router-outlet>
      </div>
    </main>

    <nav class="mobile-nav" aria-label="Mobile navigation">
      <a routerLink="/app/dashboard" routerLinkActive="active"><lucide-icon name="LayoutDashboard" size="20"></lucide-icon></a>
      <a routerLink="/app/transactions" routerLinkActive="active"><lucide-icon name="CreditCard" size="20"></lucide-icon></a>
      <a routerLink="/app/budgets" routerLinkActive="active"><lucide-icon name="Target" size="20"></lucide-icon></a>
      <a routerLink="/app/reports" routerLinkActive="active"><lucide-icon name="FileText" size="20"></lucide-icon></a>
      <a routerLink="/app/profile" routerLinkActive="active"><lucide-icon name="User" size="20"></lucide-icon></a>
    </nav>
  </div>`
})
export class ShellComponent implements OnDestroy {
  readonly navItems = [
    { label: 'Dashboard', path: '/app/dashboard', icon: 'LayoutDashboard', exact: true },
    { label: 'Transactions', path: '/app/transactions', icon: 'CreditCard' },
    { label: 'Budgets', path: '/app/budgets', icon: 'Target' },
    { label: 'Reports', path: '/app/reports', icon: 'FileText' },
    { label: 'Activity', path: '/app/activity', icon: 'Bell' },
    { label: 'Settings', path: '/app/settings', icon: 'Settings' }
  ];

  collapsed = signal(localStorage.getItem('homebudgetai.sidebar') === 'collapsed');
  dark = signal(localStorage.getItem('homebudgetai.theme') === 'dark');
  pageTitle = computed(() => 'Budget Command Center');
  initials = computed(() => (this.auth.user()?.fullName || 'Demo User').split(' ').map((x: string) => x[0]).join('').slice(0, 2).toUpperCase());

  private themeHandler = (event: Event) => {
    const detail = (event as CustomEvent<{ dark: boolean }>).detail;
    if (typeof detail?.dark === 'boolean') {
      this.dark.set(detail.dark);
    }
  };

  constructor(public auth: AuthService) {
    window.addEventListener('homebudgetai-theme', this.themeHandler);
  }

  ngOnDestroy() {
    window.removeEventListener('homebudgetai-theme', this.themeHandler);
  }

  toggleCollapsed() {
    this.collapsed.update(value => !value);
    localStorage.setItem('homebudgetai.sidebar', this.collapsed() ? 'collapsed' : 'expanded');
  }

  toggleDark() {
    this.dark.update(value => !value);
    localStorage.setItem('homebudgetai.theme', this.dark() ? 'dark' : 'light');
  }
}

