import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import Button from '@/components/common/Button';
import LoginModal from '@/components/auth/LoginModal';
import UserMenu from '@/components/layout/UserMenu';

function Header() {
  const { authState, currentView, setCurrentView } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="sticky top-0 z-50 w-full border-b border-primary-400/[0.06] bg-surface-950/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setCurrentView('landing')}
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            {/* Geometric diamond logo mark */}
            <div className="relative flex h-8 w-8 items-center justify-center">
              <div className="absolute h-5 w-5 rotate-45 border border-primary-400/40 transition-colors group-hover:border-primary-400/70" />
              <div className="absolute h-2.5 w-2.5 rotate-45 bg-primary-400/60 transition-colors group-hover:bg-primary-400" />
            </div>
            <span className="text-lg tracking-wide">
              <span className="font-display text-xl font-semibold text-primary-300">
                Sogni
              </span>{' '}
              <span className="font-light text-white/60">Makeover</span>
            </span>
          </button>

          <nav className="flex items-center gap-3">
            {currentView !== 'landing' && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setCurrentView('landing')}
                className="text-sm text-white/40 transition-colors hover:text-primary-300"
              >
                Home
              </motion.button>
            )}

            {authState.isAuthenticated ? (
              <UserMenu />
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowLoginModal(true)}
                >
                  Log In
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowLoginModal(true)}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </nav>
        </div>
      </motion.header>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />
    </>
  );
}

export default Header;
