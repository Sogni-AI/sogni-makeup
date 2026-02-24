import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/context/ToastContext';
import { useRewards } from '@/context/RewardsContext';
import { useWallet } from '@/hooks/useWallet';
import { formatTokenAmount, getTokenLabel } from '@/services/walletService';
import { MODEL_OPTIONS } from '@/constants/settings';
import type { TokenType } from '@/types/wallet';

interface UserMenuProps {
  onPurchaseClick?: () => void;
}

function UserMenu({ onPurchaseClick }: UserMenuProps) {
  const { authState, logout, setCurrentView, resetSettings, settings, updateSetting } = useApp();
  const { showToast } = useToast();
  const { rewards, claimReward } = useRewards();
  const { balances, tokenType, switchPaymentMethod } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Find daily boost reward
  const dailyBoostReward = rewards.find(r => r.id === '2');
  const canClaimDailyBoost = dailyBoostReward?.canClaim &&
    (!dailyBoostReward?.nextClaim || dailyBoostReward.nextClaim.getTime() <= Date.now());

  // Close on outside click (mousedown)
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    try {
      await logout();
      showToast('Successfully logged out', 'success');
    } catch {
      showToast('Failed to log out', 'error');
    }
  };

  const handleHistory = () => {
    setIsOpen(false);
    setCurrentView('history');
  };

  const handleResetSettings = () => {
    setIsOpen(false);
    resetSettings();
    showToast('Settings reset to defaults', 'success');
  };

  const handlePurchase = () => {
    setIsOpen(false);
    onPurchaseClick?.();
  };

  const handleSwitchPayment = (type: TokenType) => {
    switchPaymentMethod(type);
  };

  // Derive the active balance display
  const activeBalance = balances ? balances[tokenType] : null;
  const balanceDisplay = activeBalance
    ? `${formatTokenAmount(activeBalance.net)} ${getTokenLabel(tokenType)}`
    : null;

  const username = authState.user?.username ?? '';

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-white/60 transition-colors hover:bg-primary-400/[0.06] hover:text-white/90"
      >
        <span>{username}</span>
        {balanceDisplay && (
          <>
            <span className="hidden text-white/20 sm:inline">|</span>
            <span className="hidden text-[11px] text-primary-300/70 sm:inline">{balanceDisplay}</span>
          </>
        )}
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-xl border border-primary-400/[0.08] bg-surface-900 shadow-2xl"
          >
            {/* Username header */}
            <div className="px-4 pb-2 pt-4">
              <p className="text-sm font-medium text-white/90">@{username}</p>
            </div>

            {/* Balance display */}
            {balanceDisplay && (
              <div className="px-4 pb-2">
                <p className="flex items-center gap-1.5 text-xs text-white/60">
                  Balance:{' '}
                  <span className="text-primary-300">{balanceDisplay}</span>
                  <a
                    href="https://www.sogni.ai/assets"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full border border-white/20 text-[9px] leading-none text-white/40 hover:text-white/70 hover:border-white/40 transition-colors"
                    title="Learn about Sogni tokens &amp; Spark"
                  >
                    ?
                  </a>
                </p>
              </div>
            )}
            {balances === null && (
              <div className="px-4 pb-2">
                <p className="text-xs text-white/40">&mdash;</p>
              </div>
            )}

            {/* Buy Spark button */}
            {onPurchaseClick && (
              <div className="px-4 pb-2">
                <button
                  onClick={handlePurchase}
                  className="w-full rounded-lg bg-primary-400/10 px-3 py-2 text-xs font-medium text-primary-300 transition-colors hover:bg-primary-400/20"
                >
                  Buy Spark
                </button>
              </div>
            )}

            {/* Daily Boost claim button */}
            {canClaimDailyBoost && (
              <div className="px-4 pb-2">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    if (dailyBoostReward) claimReward(dailyBoostReward.id);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-300 transition-colors hover:bg-amber-400/20"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400"></span>
                  </span>
                  Claim Daily Boost
                </button>
              </div>
            )}

            {/* Model selector */}
            <div className="px-4 pb-3">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                Model
              </p>
              <select
                value={settings.defaultModel}
                onChange={(e) => updateSetting('defaultModel', e.target.value)}
                className="w-full appearance-none rounded-lg border border-primary-400/[0.08] bg-surface-800 px-3 py-1.5 text-xs font-medium text-white/80 outline-none transition-colors hover:border-primary-400/20 focus:border-primary-400/30"
              >
                {MODEL_OPTIONS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Payment method toggle */}
            <div className="px-4 pb-3">
              <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                Payment Method
              </p>
              <div className="flex gap-1.5">
                <button
                  onClick={() => handleSwitchPayment('sogni')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    tokenType === 'sogni'
                      ? 'bg-primary-400/20 text-primary-300'
                      : 'text-white/40 hover:bg-primary-400/[0.06] hover:text-white/60'
                  }`}
                >
                  SOGNI
                </button>
                <button
                  onClick={() => handleSwitchPayment('spark')}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    tokenType === 'spark'
                      ? 'bg-primary-400/20 text-primary-300'
                      : 'text-white/40 hover:bg-primary-400/[0.06] hover:text-white/60'
                  }`}
                >
                  Spark
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-primary-400/[0.06]" />

            {/* History link */}
            <button
              onClick={handleHistory}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-white/60 transition-colors hover:bg-primary-400/[0.06] hover:text-white/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </button>

            {/* Reset Settings */}
            <button
              onClick={handleResetSettings}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-white/60 transition-colors hover:bg-primary-400/[0.06] hover:text-white/90"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.992 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
              </svg>
              Reset Settings
            </button>

            {/* Divider */}
            <div className="border-t border-primary-400/[0.06]" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              disabled={authState.isLoading}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm text-white/60 transition-colors hover:bg-primary-400/[0.06] hover:text-secondary-300 disabled:opacity-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
              {authState.isLoading ? 'Logging out...' : 'Log Out'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default UserMenu;
