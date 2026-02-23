import { AppProvider, useApp } from '@/context/AppContext';
import { ToastProvider } from '@/context/ToastContext';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import LandingHero from '@/components/landing/LandingHero';
import PhotoCapture from '@/components/capture/PhotoCapture';
import MakeoverStudio from '@/components/studio/MakeoverStudio';
import ComparisonView from '@/components/results/ComparisonView';
import HistoryView from '@/components/history/HistoryView';
import SessionTransferBanner from '@/components/auth/SessionTransferBanner';
import Toast from '@/components/common/Toast';
import './App.css';

function AppContent() {
  const { currentView, authState } = useApp();

  return (
    <div className="grain-overlay flex h-dvh flex-col overflow-hidden bg-surface-950 text-white">
      <Header />
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
      <Toast />
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ToastProvider>
  );
}

export default App;
