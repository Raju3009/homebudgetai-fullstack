import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: number;
  type: ToastType;
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastSignal = signal<ToastMessage[]>([]);
  readonly toasts = this.toastSignal.asReadonly();

  show(type: ToastType, message: string, title = this.defaultTitle(type), duration = 4200): void {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    this.toastSignal.update(items => [...items, { id, type, title, message }]);
    window.setTimeout(() => this.dismiss(id), duration);
  }

  success(message: string, title = 'Success'): void {
    this.show('success', message, title);
  }

  error(message: string, title = 'Error'): void {
    this.show('error', message, title);
  }

  warning(message: string, title = 'Warning'): void {
    this.show('warning', message, title);
  }

  info(message: string, title = 'Info'): void {
    this.show('info', message, title);
  }

  dismiss(id: number): void {
    this.toastSignal.update(items => items.filter(item => item.id !== id));
  }

  private defaultTitle(type: ToastType): string {
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
