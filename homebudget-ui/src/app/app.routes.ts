import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { ShellComponent } from './layout/shell.component';

export const routes: Routes = [
  { path: '', loadComponent: () => import('./pages/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'login', loadComponent: () => import('./pages/auth/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/auth/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./pages/auth/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./pages/auth/reset-password.component').then(m => m.ResetPasswordComponent) },
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'transactions', loadComponent: () => import('./pages/transactions/transactions.component').then(m => m.TransactionsComponent) },
      { path: 'expenses', redirectTo: 'transactions' },
      { path: 'budgets', loadComponent: () => import('./pages/budgets/budgets.component').then(m => m.BudgetsComponent) },
      { path: 'reports', loadComponent: () => import('./pages/reports/reports.component').then(m => m.ReportsComponent) },
      { path: 'activity', loadComponent: () => import('./pages/activity/activity.component').then(m => m.ActivityComponent) },
      { path: 'settings', loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) }
    ]
  },
  { path: 'dashboard', redirectTo: 'app/dashboard' },
  { path: 'transactions', redirectTo: 'app/transactions' },
  { path: 'budgets', redirectTo: 'app/budgets' },
  { path: 'reports', redirectTo: 'app/reports' },
  { path: 'settings', redirectTo: 'app/settings' },
  { path: 'profile', redirectTo: 'app/profile' },
  { path: '**', redirectTo: '' }
];
