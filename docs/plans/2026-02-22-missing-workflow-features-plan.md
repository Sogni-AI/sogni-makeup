# Missing Workflow Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 7 missing basic workflow features (logout, history UI, balance display, payment toggle, settings reset, session transfer notification, email verification guidance) to match Sogni Photobooth parity.

**Architecture:** New components are added to the existing component tree. A `UserMenu` dropdown in the header provides logout, balance, payment toggle, and settings reset. A `HistoryView` page shows past makeovers. Two new notification components handle session transfer and email verification. All state flows through the existing `AppContext` and `sogniAuth` singleton.

**Tech Stack:** React 18, TypeScript, Framer Motion, Tailwind CSS, Sogni Client SDK

---

### Task 1: Add wallet types and services

Port the wallet types and service utilities from Photobooth so balance display and payment toggle have a foundation.

**Files:**
- Create: `src/types/wallet.ts`
- Create: `src/services/walletService.ts`
- Create: `src/hooks/useWallet.ts`
- Create: `src/hooks/useEntity.ts`

**Step 1: Create wallet types**

Create `src/types/wallet.ts`:

```typescript
export type TokenType = 'spark' | 'sogni';

export interface TokenBalance {
  net: string;
  settled: string;
  credit: string;
  debit: string;
  premiumCredit?: string;
}

export interface Balances {
  spark: TokenBalance;
  sogni: TokenBalance;
}
```

**Step 2: Create wallet service**

Create `src/services/walletService.ts`:

```typescript
import type { TokenType } from '@/types/wallet';

const PAYMENT_METHOD_KEY = 'sogni_payment_method';

export function getPaymentMethod(): TokenType {
  try {
    const stored = localStorage.getItem(PAYMENT_METHOD_KEY);
    if (stored === 'spark' || stored === 'sogni') {
      return stored;
    }
  } catch (error) {
    console.warn('Failed to read payment method from localStorage:', error);
  }
  return 'spark';
}

export function setPaymentMethod(tokenType: TokenType): void {
  try {
    localStorage.setItem(PAYMENT_METHOD_KEY, tokenType);
  } catch (error) {
    console.warn('Failed to save payment method to localStorage:', error);
  }
}

export function formatTokenAmount(amount: string | number, decimals: number = 2): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  if (num > 0 && num < 0.01) {
    return num.toFixed(4);
  }
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}

export function getTokenLabel(tokenType: TokenType): string {
  return tokenType === 'sogni' ? 'SOGNI' : 'Spark';
}
```

**Step 3: Create useEntity hook**

Create `src/hooks/useEntity.ts`:

```typescript
import { useEffect, useState } from 'react';

function isDataEntity(entity: unknown): entity is { on: (...args: unknown[]) => unknown; off: (...args: unknown[]) => unknown } {
  return (
    entity !== null &&
    typeof entity === 'object' &&
    'on' in entity &&
    'off' in entity
  );
}

function useEntity<E, V>(entity: E, getter: (entity: E) => V): V {
  const [value, setValue] = useState(getter(entity));

  useEffect(() => {
    setValue(getter(entity));
    if (!isDataEntity(entity)) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const unsubscribe = (entity as any).on('updated', () => {
      setValue(getter(entity));
    });

    return unsubscribe;
  }, [entity, getter]);

  return value;
}

export default useEntity;
```

**Step 4: Create useWallet hook**

Create `src/hooks/useWallet.ts`:

```typescript
import { useState, useCallback, useEffect } from 'react';
import { useSogniAuth } from '@/services/sogniAuth';
import type { TokenType, Balances } from '@/types/wallet';
import { getPaymentMethod, setPaymentMethod as savePaymentMethod } from '@/services/walletService';
import useEntity from '@/hooks/useEntity';

// Stable getter - defined outside component to prevent re-creation
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getBalanceFromAccount(currentAccount: any): Balances | null {
  if (!currentAccount?.balance) {
    return null;
  }
  return currentAccount.balance as Balances;
}

const PAYMENT_METHOD_CHANGE_EVENT = 'payment-method-change';

export function useWallet() {
  const { isAuthenticated, authMode, getSogniClient } = useSogniAuth();
  const [tokenType, setTokenType] = useState<TokenType>(getPaymentMethod());

  useEffect(() => {
    const handleChange = (event: Event) => {
      const customEvent = event as CustomEvent<TokenType>;
      setTokenType(customEvent.detail);
    };
    window.addEventListener(PAYMENT_METHOD_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(PAYMENT_METHOD_CHANGE_EVENT, handleChange);
  }, []);

  const switchPaymentMethod = useCallback((newType: TokenType) => {
    setTokenType(newType);
    savePaymentMethod(newType);
    window.dispatchEvent(new CustomEvent(PAYMENT_METHOD_CHANGE_EVENT, { detail: newType }));
  }, []);

  const sogniClient = getSogniClient();

  const balances = useEntity(
    sogniClient?.account?.currentAccount || null,
    getBalanceFromAccount,
  );

  const finalBalances = (isAuthenticated && authMode !== 'demo') ? balances : null;

  return {
    balances: finalBalances,
    tokenType,
    switchPaymentMethod,
  };
}
```

**Step 5: Verify build compiles**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npx tsc --noEmit 2>&1 | head -20`

**Step 6: Commit**

```bash
git add src/types/wallet.ts src/services/walletService.ts src/hooks/useWallet.ts src/hooks/useEntity.ts
git commit -m "feat: add wallet types, service, and hooks for balance/payment"
```

---

### Task 2: Update types and AppContext for logout, settings reset, session transfer

**Files:**
- Modify: `src/types/index.ts` (lines 76-86)
- Modify: `src/context/AppContext.tsx`

**Step 1: Update types**

In `src/types/index.ts`:

Add `'history'` to the `AppView` type:
```typescript
export type AppView = 'landing' | 'capture' | 'studio' | 'results' | 'history';
```

Add `sessionTransferred` to `AuthState`:
```typescript
export interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: SogniUser | null;
  authMode: AuthMode;
  error: string | null;
  sessionTransferred?: boolean;
}
```

**Step 2: Add logout and resetSettings to AppContext**

In `src/context/AppContext.tsx`:

Add to `AppContextValue` interface:
```typescript
logout: () => Promise<void>;
resetSettings: () => void;
```

Add the `logout` action (after `cancelGeneration`):
```typescript
const logout = useCallback(async () => {
  // Cancel any in-progress generation
  if (abortControllerRef.current) {
    abortControllerRef.current.abort();
    abortControllerRef.current = null;
  }
  setGenerationProgress(null);
  setCurrentResult(null);
  setCurrentTransformation(null);

  await sogniAuth.logout();

  setCurrentView('landing');
}, []);
```

Add the `resetSettings` action:
```typescript
const resetSettings = useCallback(() => {
  setSettings(DEFAULT_SETTINGS);
}, []);
```

Change `const [settings] = useState<AppSettings>(DEFAULT_SETTINGS);` to:
```typescript
const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
```

Wire `sessionTransferred` in the `mapAuthState` function inside the existing `useEffect` (around line 141):
```typescript
const mapAuthState = (state: ReturnType<typeof sogniAuth.getAuthState>) => {
  const user = state.user && state.user.username
    ? { id: state.user.username, username: state.user.username, email: state.user.email }
    : null;
  setAuthState({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user,
    authMode: state.authMode ?? 'demo',
    error: state.error,
    sessionTransferred: state.sessionTransferred,
  });
  // ... rest stays the same
```

Add `logout` and `resetSettings` to the context value object.

**Step 3: Verify build**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npx tsc --noEmit 2>&1 | head -20`

**Step 4: Commit**

```bash
git add src/types/index.ts src/context/AppContext.tsx
git commit -m "feat: add logout, resetSettings, sessionTransferred to AppContext"
```

---

### Task 3: Create UserMenu dropdown component

**Files:**
- Create: `src/components/layout/UserMenu.tsx`
- Modify: `src/components/layout/Header.tsx`

**Step 1: Create UserMenu component**

Create `src/components/layout/UserMenu.tsx`:

This dropdown component renders when the user clicks their username. It shows:
- `@username` header
- Balance (using `useWallet` hook, `formatTokenAmount`, `getTokenLabel`)
- Payment method toggle (two buttons: Sogni / Spark)
- Divider
- History link (navigates to history view)
- Reset Settings button
- Logout button with loading state

Key implementation details:
- Use `useState` for `isOpen`
- Use a `useEffect` with click-outside detection (attach `mousedown` listener on document when open)
- Use a `useEffect` with ESC key detection
- Use `useRef` for the menu container
- Call `useWallet()` for balance/payment
- Call `useApp()` for `authState`, `logout`, `setCurrentView`, `resetSettings`
- Use `useToast()` for success/error toasts
- Animate with framer-motion `AnimatePresence`
- Use existing Tailwind classes matching the app's design system (surface-900, primary-400, etc.)

The logout handler should:
```typescript
const handleLogout = async () => {
  try {
    await logout();
    showToast('Successfully logged out', 'success');
  } catch {
    showToast('Failed to log out', 'error');
  }
  setIsOpen(false);
};
```

**Step 2: Update Header to use UserMenu**

In `src/components/layout/Header.tsx`:

Replace the static username `<div>` (lines 49-54):
```typescript
{authState.isAuthenticated && authState.user ? (
  <div className="flex items-center gap-3">
    <span className="text-sm text-white/50">
      {authState.user.username}
    </span>
  </div>
)}
```

With:
```typescript
{authState.isAuthenticated && authState.user ? (
  <UserMenu />
)}
```

Import `UserMenu` at the top. Remove unused `authState` from the destructured `useApp()` if it's no longer needed directly in Header.

**Step 3: Verify build and test visually**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npx tsc --noEmit 2>&1 | head -20`

**Step 4: Commit**

```bash
git add src/components/layout/UserMenu.tsx src/components/layout/Header.tsx
git commit -m "feat: add UserMenu dropdown with logout, balance, payment toggle"
```

---

### Task 4: Create HistoryView component

**Files:**
- Create: `src/components/history/HistoryView.tsx`
- Modify: `src/App.tsx` (line 22)

**Step 1: Create HistoryView**

Create `src/components/history/HistoryView.tsx`:

This component shows:
- Header: "Makeover History" with a back button (returns to previous view or landing)
- If history is empty: message "No makeovers yet" + "Start Your First Makeover" button → capture view
- Grid of history items (responsive: 2 columns on mobile, 3 on tablet, 4 on desktop)
- Each card shows:
  - Result image thumbnail (or fallback placeholder if URL expired)
  - Transformation name + icon
  - Relative timestamp (e.g., "2 hours ago") — use a simple helper function
  - Cost if available
- Click a card → sets `currentResult` and `currentTransformation` in context, navigates to `results` view
- "Clear History" button at the bottom (with confirmation via `window.confirm`)

Uses: `useApp()` for `history`, `clearHistory`, `setCurrentView`, state setters. Animate with framer-motion.

**Step 2: Add history view to App.tsx**

In `src/App.tsx`, add the import and render case:

```typescript
import HistoryView from '@/components/history/HistoryView';
```

Add after the results line:
```typescript
{currentView === 'history' && <HistoryView />}
```

**Step 3: Verify build**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npx tsc --noEmit 2>&1 | head -20`

**Step 4: Commit**

```bash
git add src/components/history/HistoryView.tsx src/App.tsx
git commit -m "feat: add HistoryView page for browsing past makeovers"
```

---

### Task 5: Create SessionTransferBanner component

**Files:**
- Create: `src/components/auth/SessionTransferBanner.tsx`
- Modify: `src/App.tsx`

**Step 1: Create SessionTransferBanner**

Create `src/components/auth/SessionTransferBanner.tsx`:

```typescript
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
```

**Step 2: Wire into App.tsx**

In `AppContent`, add after `<Header />`:

```typescript
{authState.sessionTransferred && authState.error && (
  <SessionTransferBanner message={authState.error} />
)}
```

Destructure `authState` from `useApp()` in `AppContent`.

**Step 3: Verify build**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npx tsc --noEmit 2>&1 | head -20`

**Step 4: Commit**

```bash
git add src/components/auth/SessionTransferBanner.tsx src/App.tsx
git commit -m "feat: add session transfer warning banner"
```

---

### Task 6: Create EmailVerificationModal component

**Files:**
- Create: `src/components/auth/EmailVerificationModal.tsx`
- Modify: `src/App.tsx`

**Step 1: Create EmailVerificationModal**

Create `src/components/auth/EmailVerificationModal.tsx`:

Uses the existing `Modal` component (`src/components/common/Modal.tsx`) and `Button` component.

```typescript
import { useState } from 'react';
import Modal from '@/components/common/Modal';
import Button from '@/components/common/Button';
import { sogniAuth } from '@/services/sogniAuth';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function EmailVerificationModal({ isOpen, onClose }: EmailVerificationModalProps) {
  const [isChecking, setIsChecking] = useState(false);

  const handleRetry = async () => {
    setIsChecking(true);
    try {
      const result = await sogniAuth.checkExistingSession();
      if (result) {
        onClose();
      }
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Email Verification Required" size="sm">
      <div className="space-y-4">
        <p className="text-sm text-white/60">
          Your Sogni account email needs to be verified before you can generate images.
          Please check your inbox and verify your email address.
        </p>
        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            fullWidth
            onClick={() => window.open('https://app.sogni.ai', '_blank')}
          >
            Go to Sogni App
          </Button>
          <Button
            variant="outline"
            fullWidth
            loading={isChecking}
            onClick={handleRetry}
          >
            {isChecking ? 'Checking...' : "I've Verified — Try Again"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default EmailVerificationModal;
```

**Step 2: Wire into App.tsx**

In `AppContent`:

Add state and event listener:
```typescript
const [showEmailVerification, setShowEmailVerification] = useState(false);

useEffect(() => {
  const handler = () => setShowEmailVerification(true);
  window.addEventListener('sogni-email-verification-required', handler);
  return () => window.removeEventListener('sogni-email-verification-required', handler);
}, []);
```

Add before `<Toast />`:
```typescript
<EmailVerificationModal
  isOpen={showEmailVerification}
  onClose={() => setShowEmailVerification(false)}
/>
```

**Step 3: Verify build**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npx tsc --noEmit 2>&1 | head -20`

**Step 4: Commit**

```bash
git add src/components/auth/EmailVerificationModal.tsx src/App.tsx
git commit -m "feat: add email verification guidance modal"
```

---

### Task 7: Add History button to studio toolbar

**Files:**
- Modify: `src/components/studio/MakeoverStudio.tsx` (line 112-130)

**Step 1: Add History button**

In the toolbar div (lines 112-130), add a History button after the "New Photo" button:

```typescript
{authState.isAuthenticated && history.length > 0 && (
  <>
    <span className="text-[10px] text-white/10">|</span>
    <button
      onClick={() => setCurrentView('history')}
      className="flex items-center gap-1 text-xs text-white/35 transition-colors hover:text-white/60"
    >
      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      History
    </button>
  </>
)}
```

Destructure `history` from `useApp()`.

**Step 2: Verify build**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npx tsc --noEmit 2>&1 | head -20`

**Step 3: Commit**

```bash
git add src/components/studio/MakeoverStudio.tsx
git commit -m "feat: add History button to studio toolbar"
```

---

### Task 8: Lint and final validation

**Step 1: Run linter**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run lint`

Fix any issues found.

**Step 2: Run useEffect validator**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run validate:useeffect`

Fix any issues found.

**Step 3: Build check**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run build 2>&1 | tail -20`

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve lint and build issues"
```
