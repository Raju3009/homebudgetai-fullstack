import { ApplicationConfig, importProvidersFrom, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { routes } from './app.routes';
import { authInterceptor } from './core/auth.interceptor';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Check,
  CreditCard,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Target,
  User,
  WalletCards,
  LucideAngularModule
} from 'lucide-angular';

const icons = { ArrowRight, BarChart3, Bell, Check, CreditCard, FileText, LayoutDashboard, LockKeyhole, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Search, Settings, ShieldCheck, Sparkles, Sun, Target, User, WalletCards };

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(LucideAngularModule.pick(icons))
  ]
};
