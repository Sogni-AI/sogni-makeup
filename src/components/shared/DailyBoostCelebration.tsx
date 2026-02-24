import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Turnstile from 'react-turnstile';
import { getTurnstileKey } from '@/config/env';
import ConfettiCelebration from './ConfettiCelebration';
import './DailyBoostCelebration.css';

type CelebrationState = 'idle' | 'claiming' | 'success';

interface DailyBoostCelebrationProps {
  isVisible: boolean;
  creditAmount: number;
  onClaim: (turnstileToken: string) => void;
  onDismiss: () => void;
  isClaiming: boolean;
  claimSuccess: boolean;
  claimError: string | null;
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.92, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 12 },
};

const contentVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const GiftIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12v10H4V12" />
    <path d="M2 7h20v5H2z" />
    <path d="M12 22V7" />
    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const SparkleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
  </svg>
);

const DailyBoostCelebration: React.FC<DailyBoostCelebrationProps> = ({
  isVisible,
  creditAmount,
  onClaim,
  onDismiss,
  isClaiming,
  claimSuccess,
  claimError
}) => {
  const [state, setState] = useState<CelebrationState>('idle');
  const [showTurnstile, setShowTurnstile] = useState(false);
  const [displayedCredits, setDisplayedCredits] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const autoCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const counterIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasHandledSuccessRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const creditAmountRef = useRef(creditAmount);
  creditAmountRef.current = creditAmount;

  // Reset state when modal visibility changes
  useEffect(() => {
    if (isVisible) {
      setState('idle');
      setShowTurnstile(false);
      setDisplayedCredits(0);
      setShowConfetti(false);
      hasHandledSuccessRef.current = false;
    }
  }, [isVisible]);

  // Track claiming state from props
  useEffect(() => {
    if (isClaiming) {
      setState((prev) => prev === 'idle' ? 'claiming' : prev);
    }
  }, [isClaiming]);

  // Handle claim error - close modal after brief delay
  useEffect(() => {
    if (!claimError) return;

    const errorTimeout = setTimeout(() => {
      onDismissRef.current();
    }, 800);

    return () => clearTimeout(errorTimeout);
  }, [claimError]);

  // Handle successful claim
  useEffect(() => {
    if (!claimSuccess || hasHandledSuccessRef.current) return;

    hasHandledSuccessRef.current = true;
    const amount = creditAmountRef.current;
    setState('success');
    setShowConfetti(true);
    setDisplayedCredits(amount);

    // Animate the credit counter
    const duration = 800;
    const steps = 16;
    const startValue = Math.max(0, amount - 15);
    const increment = (amount - startValue) / steps;
    let current = startValue;

    setDisplayedCredits(startValue);

    counterIntervalRef.current = setInterval(() => {
      current += increment;
      if (current >= amount) {
        setDisplayedCredits(amount);
        if (counterIntervalRef.current) {
          clearInterval(counterIntervalRef.current);
          counterIntervalRef.current = null;
        }
      } else {
        setDisplayedCredits(Math.round(current));
      }
    }, duration / steps);

    // Auto-close after 2.5 seconds
    autoCloseTimeoutRef.current = setTimeout(() => {
      onDismissRef.current();
    }, 2500);
  }, [claimSuccess]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimeoutRef.current) {
        clearTimeout(autoCloseTimeoutRef.current);
      }
      if (counterIntervalRef.current) {
        clearInterval(counterIntervalRef.current);
      }
    };
  }, []);

  const handleClaimClick = useCallback(() => {
    setShowTurnstile(true);
  }, []);

  const handleTurnstileVerify = useCallback((token: string) => {
    setShowTurnstile(false);
    onClaim(token);
  }, [onClaim]);

  const handleDismiss = useCallback(() => {
    if (autoCloseTimeoutRef.current) {
      clearTimeout(autoCloseTimeoutRef.current);
    }
    onDismiss();
  }, [onDismiss]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && state === 'idle' && !showTurnstile) {
      handleDismiss();
    }
  }, [state, showTurnstile, handleDismiss]);

  const modalContent = (
    <>
      <ConfettiCelebration isVisible={showConfetti} />

      <AnimatePresence>
        {isVisible && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-5">
            {/* Backdrop */}
            <motion.div
              variants={backdropVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-surface-950/80 backdrop-blur-md"
              onClick={handleBackdropClick}
            />

            {/* Modal */}
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[360px] overflow-hidden rounded-2xl border border-primary-400/[0.08] bg-surface-900 p-8 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Floating sparkle particles */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="daily-boost-sparkle" />
                ))}
              </div>

              {/* Deco line top */}
              <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary-400/30 to-transparent" />

              {/* Header */}
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.1, duration: 0.4 }}
                className="text-center mb-2"
              >
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary-400/60 mb-1">
                  Daily Reward
                </p>
                <h2 className="font-display text-2xl font-medium gradient-text">
                  Daily Boost
                </h2>
              </motion.div>

              {/* Subtitle */}
              <motion.p
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.15, duration: 0.4 }}
                className="text-center text-sm text-white/40 mb-6"
              >
                {state === 'success'
                  ? 'Credits added to your account'
                  : 'Your free daily credits are ready'}
              </motion.p>

              {/* Icon container */}
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.2, duration: 0.5 }}
                className="flex justify-center mb-6"
              >
                <div className={`daily-boost-glow-ring ${state === 'success' ? 'success' : ''} relative flex items-center justify-center w-20 h-20 rounded-full border border-primary-400/15 bg-surface-800`}>
                  {state === 'success' ? (
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      <CheckIcon className="w-9 h-9 text-primary-400" />
                    </motion.div>
                  ) : state === 'claiming' ? (
                    <div className="daily-boost-spinner" />
                  ) : (
                    <motion.div
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <GiftIcon className="w-9 h-9 text-primary-400" />
                    </motion.div>
                  )}

                  {/* Corner sparkle accents */}
                  {state === 'idle' && (
                    <>
                      <SparkleIcon className="absolute -top-1 -right-1 w-3.5 h-3.5 text-primary-400/40" />
                      <SparkleIcon className="absolute -bottom-0.5 -left-1 w-2.5 h-2.5 text-primary-400/25" />
                    </>
                  )}
                </div>
              </motion.div>

              {/* Credit amount */}
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: 0.25, duration: 0.4 }}
                className="text-center mb-8"
              >
                <div className="flex items-baseline justify-center gap-1.5">
                  <span className="text-lg font-semibold text-primary-400/70">+</span>
                  <span className="daily-boost-credit-number text-5xl font-bold tracking-tight">
                    {state === 'success' ? displayedCredits : creditAmount}
                  </span>
                </div>
                <p className="text-xs font-medium uppercase tracking-[0.15em] text-white/30 mt-1">
                  Spark Credits
                </p>
              </motion.div>

              {/* Action area */}
              <AnimatePresence mode="wait">
                {/* Claim button */}
                {state === 'idle' && !showTurnstile && (
                  <motion.div
                    key="claim-btn"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                  >
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleClaimClick}
                      className="w-full py-3 px-6 rounded-xl bg-gradient-to-r from-primary-400 to-primary-500 text-surface-950 font-semibold text-sm tracking-wide shadow-lg shadow-primary-400/15 transition-all duration-200 hover:from-primary-300 hover:to-primary-400 cursor-pointer"
                    >
                      Claim Now
                    </motion.button>
                  </motion.div>
                )}

                {/* Turnstile verification */}
                {showTurnstile && state === 'idle' && (
                  <motion.div
                    key="turnstile"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25 }}
                    className="daily-boost-turnstile flex flex-col items-center gap-3"
                  >
                    <p className="text-xs text-white/40">Quick verification</p>
                    <Turnstile
                      sitekey={getTurnstileKey()}
                      onVerify={handleTurnstileVerify}
                    />
                  </motion.div>
                )}

                {/* Claiming state */}
                {state === 'claiming' && (
                  <motion.div
                    key="claiming"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-center"
                  >
                    <p className="text-sm text-white/40">Claiming your credits...</p>
                  </motion.div>
                )}

                {/* Success state */}
                {state === 'success' && (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-center"
                  >
                    <p className="text-sm font-medium gradient-text">Claimed!</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dismiss link */}
              {state === 'idle' && !showTurnstile && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  onClick={handleDismiss}
                  className="block w-full mt-4 text-center text-xs text-white/25 hover:text-white/45 transition-colors duration-200 cursor-pointer"
                >
                  Maybe later
                </motion.button>
              )}

              {/* Deco line bottom */}
              <div className="absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-primary-400/20 to-transparent" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default React.memo(DailyBoostCelebration);
