import { useState, useEffect } from 'react';
import { AppProvider, useApp } from '@/context/AppContext';
import { ToastProvider } from '@/context/ToastContext';
import { RewardsProvider, useRewards } from '@/context/RewardsContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LandingHero from '@/components/landing/LandingHero';
import PhotoCapture from '@/components/capture/PhotoCapture';
import MakeoverStudio from '@/components/studio/MakeoverStudio';
import ComparisonView from '@/components/results/ComparisonView';
import HistoryView from '@/components/history/HistoryView';
import SessionTransferBanner from '@/components/auth/SessionTransferBanner';
import EmailVerificationModal from '@/components/auth/EmailVerificationModal';
import DailyBoostCelebration from '@/components/shared/DailyBoostCelebration';
import StripePurchase from '@/components/stripe/StripePurchase';
import Toast from '@/components/common/Toast';
import './App.css';

function AppContent() {
  const { currentView, authState } = useApp();
  const { rewards, loading: rewardsLoading, claimInProgress, lastClaimSuccess, claimRewardWithToken, resetClaimState, error: rewardsError } = useRewards();
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showDailyBoost, setShowDailyBoost] = useState(false);
  const [showStripePurchase, setShowStripePurchase] = useState(false);

  // Find the Daily Boost reward (id "2")
  const dailyBoostReward = rewards.find(r => r.id === '2');
  const canClaimDailyBoost = dailyBoostReward?.canClaim &&
    (!dailyBoostReward?.nextClaim || dailyBoostReward.nextClaim.getTime() <= Date.now());

  // Auto-show Daily Boost celebration when claimable
  useEffect(() => {
    if (!authState.isAuthenticated || rewardsLoading || rewards.length === 0) return;
    if (!canClaimDailyBoost) return;
    setShowDailyBoost(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authState.isAuthenticated, rewardsLoading, rewards.length]);

  useEffect(() => {
    const handler = () => setShowEmailVerification(true);
    window.addEventListener('sogni-email-verification-required', handler);
    return () => window.removeEventListener('sogni-email-verification-required', handler);
  }, []);

  return (
    <div className="grain-overlay flex h-dvh flex-col overflow-hidden bg-surface-950 text-white">
      <Header onPurchaseClick={
        authState.isAuthenticated && authState.authMode === 'frontend'
          ? () => setShowStripePurchase(true)
          : undefined
      } />
      {authState.sessionTransferred && authState.error && (
        <SessionTransferBanner message={authState.error} />
      )}
      <main className="min-h-0 flex-1 overflow-y-auto">
        {currentView === 'landing' && <LandingHero />}
        {currentView === 'capture' && <PhotoCapture />}
        {currentView === 'studio' && <MakeoverStudio />}
        {currentView === 'results' && <ComparisonView />}
        {currentView === 'history' && <HistoryView />}
      </main>
      {(currentView === 'landing') && <Footer />}
      <EmailVerificationModal
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
      />
      <DailyBoostCelebration
        isVisible={showDailyBoost}
        creditAmount={dailyBoostReward ? parseFloat(dailyBoostReward.amount) : 0}
        onClaim={(token) => {
          if (dailyBoostReward) {
            claimRewardWithToken(dailyBoostReward.id, token);
          }
        }}
        onDismiss={() => {
          setShowDailyBoost(false);
          resetClaimState();
        }}
        isClaiming={claimInProgress}
        claimSuccess={lastClaimSuccess}
        claimError={rewardsError}
      />
      {showStripePurchase && (
        <StripePurchase onClose={() => setShowStripePurchase(false)} />
      )}
      <Toast />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <RewardsProvider>
          <AppContent />
        </RewardsProvider>
      </AppProvider>
    </ToastProvider>
  );
}

export default App;
