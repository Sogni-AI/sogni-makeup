import React, { createContext, useContext, useCallback, useState, useRef } from 'react';
import type { Toast, ToastType } from '@/types';

const MAX_VISIBLE_TOASTS = 3;
const DEFAULT_DURATION = 5000;

interface ToastContextValue {
  toasts: Toast[];
  showToast: (message: string, type: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
  /** Alias for showToast with (type, message) argument order */
  addToast: (type: ToastType, message: string, duration?: number) => void;
  /** Alias for dismissToast */
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

/**
 * Hook to consume the ToastContext. Must be used inside ToastProvider.
 */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  /**
   * Remove a toast by id and clear its auto-dismiss timer.
   */
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));

    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  /**
   * Show a new toast notification.
   * Enforces a maximum of MAX_VISIBLE_TOASTS at a time by removing the oldest.
   * Auto-dismisses after `duration` ms (default 5000). Pass 0 to disable auto-dismiss.
   */
  const showToast = useCallback(
    (message: string, type: ToastType, duration: number = DEFAULT_DURATION) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      const toast: Toast = { id, type, message, duration };

      setToasts((prev) => {
        // Keep only the most recent toasts, evicting the oldest when at capacity
        const next = [...prev, toast];
        if (next.length > MAX_VISIBLE_TOASTS) {
          const removed = next.shift();
          if (removed) {
            const timer = timersRef.current.get(removed.id);
            if (timer) {
              clearTimeout(timer);
              timersRef.current.delete(removed.id);
            }
          }
        }
        return next;
      });

      if (duration > 0) {
        const timer = setTimeout(() => {
          dismissToast(id);
        }, duration);
        timersRef.current.set(id, timer);
      }
    },
    [dismissToast],
  );

  // Alias with (type, message) argument order used by some components
  const addToast = useCallback(
    (type: ToastType, message: string, duration?: number) => {
      showToast(message, type, duration);
    },
    [showToast],
  );

  // Alias for dismissToast
  const removeToast = dismissToast;

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export default ToastContext;
