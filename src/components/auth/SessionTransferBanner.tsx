import { motion, AnimatePresence } from 'framer-motion';

interface SessionTransferBannerProps {
  message: string;
}

function SessionTransferBanner({ message }: SessionTransferBannerProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-3"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <p className="text-sm text-amber-200/80">{message}</p>
          <button
            onClick={() => window.location.reload()}
            className="ml-4 flex-shrink-0 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-200 transition-colors hover:bg-amber-500/30"
          >
            Refresh
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SessionTransferBanner;
