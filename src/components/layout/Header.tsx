import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import Button from '@/components/common/Button';
import LoginModal from '@/components/auth/LoginModal';

function Header() {
  const { authState, currentView, setCurrentView } = useApp();
  const [showLoginModal, setShowLoginModal] = useState(false);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="sticky top-0 z-50 w-full border-b border-white/5 bg-gray-950/80 backdrop-blur-xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => setCurrentView('landing')}
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <span className="text-xl">&#10024;</span>
            <span className="text-lg font-semibold tracking-tight">
              <span className="bg-gradient-to-r from-rose-400 to-purple-400 bg-clip-text text-transparent">
                Sogni
              </span>{' '}
              <span className="text-white/90">Makeover</span>
            </span>
          </button>

          <nav className="flex items-center gap-3">
            {currentView !== 'landing' && (
              <motion.button
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                onClick={() => setCurrentView('landing')}
                className="text-sm text-white/50 transition-colors hover:text-white/80"
              >
                Home
              </motion.button>
            )}

            {authState.isAuthenticated && authState.user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm text-white/60">
                  {authState.user.username}
                </span>
              </div>
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
