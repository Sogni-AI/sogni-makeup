import { useState } from 'react';
import { useToast } from '@/context/ToastContext';
import { sogniAuth } from '@/services/sogniAuth';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const { addToast } = useToast();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const success = await sogniAuth.login(username.trim(), password);

      if (success) {
        addToast('success', `Welcome back, ${username.trim()}!`);
        setUsername('');
        setPassword('');
        onClose();
      } else {
        const authState = sogniAuth.getAuthState();
        setError(authState.error || 'Login failed. Please check your credentials and try again.');
      }
    } catch (err: unknown) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      if ((err as any)?.code === 4052 || (err instanceof Error && err.message?.includes('verify your email'))) {
        setError('Email verification required. Please verify your email at app.sogni.ai and try again.');
        window.dispatchEvent(new CustomEvent('sogni-email-verification-required', {
          detail: {
            error: err,
            message: 'Your Sogni account email needs to be verified to generate images.',
          },
        }));
      } else {
        setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials and try again.');
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sign In to Sogni" size="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="login-username"
            className="mb-1.5 block text-sm font-medium text-white/60"
          >
            Username
          </label>
          <input
            id="login-username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            autoComplete="username"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-rose-500/30 focus:bg-white/[0.07]"
            disabled={isLoading}
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-1.5 block text-sm font-medium text-white/60"
          >
            Password
          </label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none transition-colors focus:border-rose-500/30 focus:bg-white/[0.07]"
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          fullWidth
          loading={isLoading}
        >
          Sign In
        </Button>

        <p className="text-center text-xs text-white/30">
          Don&apos;t have an account?{' '}
          <a
            href="https://sogni.ai/signup"
            target="_blank"
            rel="noopener noreferrer"
            className="text-rose-400 transition-colors hover:text-rose-300"
          >
            Sign up at sogni.ai
          </a>
        </p>
      </form>
    </Modal>
  );
}

export default LoginModal;
