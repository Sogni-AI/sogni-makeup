import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  status?: string;
  message?: string;
  showPercentage?: boolean;
  className?: string;
}

function ProgressBar({
  progress,
  status,
  message,
  showPercentage = true,
  className = '',
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <div className={`w-full ${className}`}>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/5">
        <motion.div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${clampedProgress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
        {clampedProgress > 0 && clampedProgress < 100 && (
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-rose-400/50 to-purple-400/50"
            animate={{
              width: [`${clampedProgress}%`, `${Math.min(100, clampedProgress + 5)}%`],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          {status && (
            <p className="text-xs font-medium text-white/70">{status}</p>
          )}
          {message && (
            <p className="truncate text-xs text-white/40">{message}</p>
          )}
        </div>
        {showPercentage && (
          <span className="flex-shrink-0 text-xs font-medium tabular-nums text-white/50">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
    </div>
  );
}

export default ProgressBar;
