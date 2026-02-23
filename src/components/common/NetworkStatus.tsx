import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ConnectionState = 'connected' | 'reconnecting' | 'disconnected';

const statusConfig: Record<ConnectionState, { color: string; label: string }> = {
  connected: { color: 'bg-emerald-400', label: 'Connected' },
  reconnecting: { color: 'bg-amber-400', label: 'Reconnecting...' },
  disconnected: { color: 'bg-red-400', label: 'Disconnected' },
};

function NetworkStatus() {
  const [status, setStatus] = useState<ConnectionState>(
    navigator.onLine ? 'connected' : 'disconnected'
  );

  useEffect(() => {
    const handleOnline = () => setStatus('connected');
    const handleOffline = () => setStatus('disconnected');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const isVisible = status !== 'connected';
  const config = statusConfig[status];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border border-white/10 bg-gray-900/90 px-4 py-2 shadow-xl backdrop-blur-sm"
        >
          <span className={`h-2 w-2 rounded-full ${config.color} ${status === 'reconnecting' ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-medium text-white/70">
            {config.label}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default NetworkStatus;
