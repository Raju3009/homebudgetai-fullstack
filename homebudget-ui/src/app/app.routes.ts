import { Routes } from '@angular/router';

import { authGuard } from './core/auth-guard';

export const routes: Routes = [

  // =========================
  // LANDING
  // =========================

  {
    path: '',

    loadComponent: () =>

      import('./pages/portfolio/portfolio.component')
        .then(m => m.PortfolioComponent)
  },

  // =========================
  // LOGIN
  // =========================

  {
    path: 'login',

    loadComponent: () =>

      import('./pages/auth/login.component')
        .then(m => m.LoginComponent)
  },

  // =========================
  // REGISTER
  // =========================

  {
    path: 'register',

    loadComponent: () =>

      import('./pages/auth/register.component')
        .then(m => m.RegisterComponent)
  },

  // =========================
  // APP LAYOUT
  // =========================

  {
    path: 'app',

    loadComponent: () =>

      import('./layout/shell.component')
        .then(m => m.ShellComponent),

    canActivate: [authGuard],

    children: [

      // DASHBOARD

      {
        path: 'dashboard',

        loadComponent: () =>

          import('./pages/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      // BUDGETS

      {
        path: 'budgets',

        loadComponent: () =>

          import('./pages/budgets/budgets.component')
            .then(m => m.BudgetsComponent)
      },

      // REPORTS

      {
        path: 'reports',

        loadComponent: () =>

          import('./pages/reports/reports.component')
            .then(m => m.ReportsComponent)
      },

      // TRANSACTIONS

      {
        path: 'transactions',

        loadComponent: () =>

          import('./pages/transactions/transactions.component')
            .then(m => m.TransactionsComponent)
      },

      // SETTINGS

      {
        path: 'settings',

        loadComponent: () =>

          import('./pages/settings/settings.component')
            .then(m => m.SettingsComponent)
      },

      // PROFILE

      {
        path: 'profile',

        loadComponent: () =>

          import('./pages/profile/profile.component')
            .then(m => m.ProfileComponent)
      },

      // ACTIVITY

      {
        path: 'activity',

        loadComponent: () =>

          import('./pages/activity/activity.component')
            .then(m => m.ActivityComponent)
      },

      // DEFAULT

      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },

  // =========================
  // WILDCARD
  // =========================

  {
    path: '**',

    redirectTo: ''
  }
];