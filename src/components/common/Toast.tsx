import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/context/ToastContext';
import type { ToastType } from '@/types';

const typeStyles: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: {
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/15',
    icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  error: {
    bg: 'bg-secondary-500/8',
    border: 'border-secondary-500/15',
    icon: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  info: {
    bg: 'bg-blue-500/8',
    border: 'border-blue-500/15',
    icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    bg: 'bg-primary-400/8',
    border: 'border-primary-400/15',
    icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.832c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z',
  },
};

const typeTextColor: Record<ToastType, string> = {
  success: 'text-emerald-400',
  error: 'text-secondary-400',
  info: 'text-blue-400',
  warning: 'text-primary-300',
};

function Toast() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed right-4 top-20 z-[110] flex max-w-[calc(100vw-2rem)] flex-col gap-2">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => {
          const style = typeStyles[toast.type];
          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className={`flex max-w-sm items-start gap-3 rounded-xl border ${style.border} ${style.bg} p-4 shadow-lg backdrop-blur-md`}
            >
              <svg
                className={`mt-0.5 h-5 w-5 flex-shrink-0 ${typeTextColor[toast.type]}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={style.icon}
                />
              </svg>
              <p className="flex-1 text-sm text-white/80">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="flex-shrink-0 text-white/20 transition-colors hover:text-white/50"
                aria-label="Dismiss notification"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export default Toast;
