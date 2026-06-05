import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      <article class="toast-card" *ngFor="let toast of toastService.toasts()" [class]="toast.type">
        <div class="toast-icon" aria-hidden="true">{{ icon(toast.type) }}</div>
        <div>
          <strong>{{ toast.title }}</strong>
          <p>{{ toast.message }}</p>
        </div>
        <button type="button" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss notification">x</button>
      </article>
    </div>
  `,
  styles: [`
    :host { position: fixed; inset: auto 1rem 1rem auto; z-index: 1000; pointer-events: none; }
    .toast-stack { width: min(380px, calc(100vw - 2rem)); display: grid; gap: 0.75rem; }
    .toast-card { pointer-events: auto; display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start; gap: 0.8rem; padding: 0.95rem; border: 1px solid rgba(15, 23, 42, 0.12); border-radius: 16px; color: #13231f; background: rgba(255, 255, 255, 0.94); box-shadow: 0 22px 70px rgba(15, 23, 42, 0.18); backdrop-filter: blur(18px); animation: toastIn 0.28s ease both; }
    .toast-card.success { border-left: 5px solid #16a34a; }
    .toast-card.error { border-left: 5px solid #dc2626; }
    .toast-card.warning { border-left: 5px solid #d97706; }
    .toast-card.info { border-left: 5px solid #2563eb; }
    .toast-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 12px; color: #fff; background: #0f766e; font-weight: 900; }
    .toast-card.error .toast-icon { background: #dc2626; }
    .toast-card.warning .toast-icon { background: #d97706; }
    .toast-card.info .toast-icon { background: #2563eb; }
    strong, p { margin: 0; }
    p { color: #65736f; line-height: 1.45; margin-top: 0.15rem; }
    button { width: 30px; height: 30px; border: 0; border-radius: 10px; color: #65736f; background: rgba(15, 23, 42, 0.06); cursor: pointer; }
    @keyframes toastIn { from { opacity: 0; transform: translateY(12px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @media (max-width: 560px) { :host { inset: auto 0.75rem 0.75rem; } }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  icon(type: string): string {
    return type === 'success' ? 'OK' : type === 'error' ? '!' : type === 'warning' ? '!' : 'i';
  }
}
