import { Routes } from '@angular/router';
import { ExpensesComponent } from './pages/expenses/expenses.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

  { path: 'dashboard', component: DashboardComponent },
  { path: 'expenses', component: ExpensesComponent }
];