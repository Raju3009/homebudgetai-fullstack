import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { Check, Info, TriangleAlert, X, XCircle } from 'lucide-react';

/* eslint-disable react-refresh/only-export-components */
const ToastContext = createContext(null);
const icons = { success: Check, error: XCircle, warning: TriangleAlert, info: Info };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const show = useCallback((type, message, title) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, type, title: title || type[0].toUpperCase() + type.slice(1), message }]);
    window.setTimeout(() => dismiss(id), 4200);
  }, [dismiss]);

  const value = useMemo(() => ({
    success: (message, title) => show('success', message, title),
    error: (message, title) => show('error', message, title),
    warning: (message, title) => show('warning', message, title),
    info: (message, title) => show('info', message, title),
  }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => {
          const Icon = icons[toast.type] || Info;
          return (
            <article className={`toast-card ${toast.type}`} key={toast.id}>
              <div className="toast-icon" aria-hidden="true"><Icon size={18} /></div>
              <div><strong>{toast.title}</strong><p>{toast.message}</p></div>
              <button type="button" onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"><X size={16} /></button>
            </article>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used within ToastProvider.');
  return value;
}
