import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginModal from '@/components/auth/LoginModal';
import Button from '@/components/common/Button';

interface DemoBannerProps {
  generationsRemaining: number;
}

function DemoBanner({ generationsRemaining }: DemoBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const isLimitReached = generationsRemaining <= 0;

  return (
    <>
      <AnimatePresence>
        {!isDismissed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`mb-3 overflow-hidden rounded-xl border ${
              isLimitReached
                ? 'border-amber-500/20 bg-amber-500/5'
                : 'border-white/10 bg-white/5'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-2">
              <p className="text-xs text-white/50 sm:text-sm">
                {isLimitReached ? (
                  <>Sign in to continue creating makeovers</>
                ) : (
                  <>
                    You have{' '}
                    <span className="font-semibold text-rose-400">
                      {generationsRemaining}
                    </span>{' '}
                    free {generationsRemaining === 1 ? 'makeover' : 'makeovers'} remaining.{' '}
                    <span className="hidden sm:inline">Sign in for unlimited!</span>
                  </>
                )}
              </p>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowLogin(true)}
                >
                  Sign In
                </Button>
                {!isLimitReached && (
                  <button
                    onClick={() => setIsDismissed(true)}
                    className="flex h-6 w-6 items-center justify-center rounded-md text-white/20 transition-colors hover:bg-white/5 hover:text-white/40"
                    aria-label="Dismiss banner"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}

export default DemoBanner;
