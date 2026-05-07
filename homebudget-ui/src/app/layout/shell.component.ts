import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
  <div class="app-shell" [class.dark-mode]="dark()">
    <aside class="sidebar">
      <div class="brand"><span>HB</span><strong>HomeBudgetAI</strong></div>
      <nav>
        <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
        <a routerLink="/transactions" routerLinkActive="active">Transactions</a>
        <a routerLink="/profile" routerLinkActive="active">Profile</a>
      </nav>
      <button class="ghost" (click)="toggleDark()">{{ dark() ? 'Light mode' : 'Dark mode' }}</button>
    </aside>
    <main>
      <header class="topbar">
        <div><small>Workspace</small><h1>Budget Command Center</h1></div>
        <div class="user-pill"><span>{{ auth.user()?.fullName || 'User' }}</span><button (click)="auth.logout()">Logout</button></div>
      </header>
      <router-outlet></router-outlet>
    </main>
  </div>`
})
export class ShellComponent {
  dark = signal(localStorage.getItem('homebudgetai.theme') === 'dark');
  constructor(public auth: AuthService) {}
  toggleDark() { this.dark.update(v => !v); localStorage.setItem('homebudgetai.theme', this.dark() ? 'dark' : 'light'); }
}
