# Daily Boost & Stripe Payments Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Daily Boost reward claiming and Stripe credit card purchases to the makeover app, ported from the photobooth reference implementation.

**Architecture:** Both features use direct Sogni SDK API calls from the frontend (no backend changes). Daily Boost uses `sogniClient.account.rewards()` and `sogniClient.account.claimRewards()`. Stripe uses REST endpoints `/v1/iap/stripe/*` via `sogniClient.apiClient.rest`. Both are authenticated-only features.

**Tech Stack:** React 18, TypeScript, Vite, Sogni Client SDK, Swiper (carousel), react-turnstile (bot protection), Framer Motion (existing)

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install swiper and react-turnstile**

```bash
npm install swiper react-turnstile
```

**Step 2: Verify installation**

```bash
npm ls swiper react-turnstile
```

Expected: Both packages listed without errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add swiper and react-turnstile dependencies"
```

---

## Task 2: Create Reward Types

**Files:**
- Create: `src/types/rewards.ts`

**Step 1: Create the rewards type file**

```typescript
/**
 * Rewards types for daily boost and other claim features
 */

export interface Reward {
  id: string;
  title: string;
  description?: string;
  amount: string;
  tokenType: 'spark' | 'sogni';
  canClaim: boolean;
  claimed?: boolean;
  nextClaim?: Date;
  provider?: string;
}
```

**Step 2: Verify no TypeScript errors**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/types/rewards.ts
git commit -m "feat: add Reward type definition"
```

---

## Task 3: Add Turnstile Config Utility

**Files:**
- Create: `src/config/env.ts`

**Step 1: Create the env config file**

```typescript
/**
 * Environment configuration utilities
 */

/**
 * Get Turnstile site key for bot protection
 */
export const getTurnstileKey = (): string => {
  const env = import.meta.env as Record<string, unknown>;
  const key = env['VITE_TURNSTILE_KEY'];
  return typeof key === 'string' ? key : '';
};
```

**Step 2: Verify the VITE_TURNSTILE_KEY is in `.env.local`**

Check that `VITE_TURNSTILE_KEY` exists in `.env.local`. It should already be there per the CLAUDE.md notes. If not, add it:

```
VITE_TURNSTILE_KEY=0x4AAAAAABA3JGUSIHxBNhO5
```

**Step 3: Commit**

```bash
git add src/config/env.ts
git commit -m "feat: add Turnstile config utility"
```

---

## Task 4: Create Sonic Logo Utility

**Files:**
- Create: `src/utils/sonicLogos.ts`

**Step 1: Create the sonic logos utility**

Port from photobooth `src/utils/sonicLogos/index.ts`. This provides audio feedback for Daily Boost claims and Stripe purchase success. The full implementation uses Web Audio API for synthesized sounds.

Copy the complete file from `/Users/markledford/Documents/git/sogni-photobooth/src/utils/sonicLogos/index.ts` and adapt:
- No changes needed — the file is self-contained with no external dependencies.

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/utils/sonicLogos.ts
git commit -m "feat: add sonic logo audio utilities"
```

---

## Task 5: Create Confetti Celebration Component

**Files:**
- Create: `src/components/shared/ConfettiCelebration.tsx`
- Create: `src/components/shared/ConfettiCelebration.css`

**Step 1: Create the ConfettiCelebration component**

Port from photobooth `src/components/shared/ConfettiCelebration.tsx`. The component is self-contained React with CSS animations. Copy both the `.tsx` and `.css` files directly — no adaptations needed since they use standard React patterns already present in the makeover app.

Reference files:
- `/Users/markledford/Documents/git/sogni-photobooth/src/components/shared/ConfettiCelebration.tsx`
- `/Users/markledford/Documents/git/sogni-photobooth/src/components/shared/ConfettiCelebration.css`

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/components/shared/ConfettiCelebration.tsx src/components/shared/ConfettiCelebration.css
git commit -m "feat: add confetti celebration component"
```

---

## Task 6: Create RewardsContext Provider

**Files:**
- Create: `src/context/RewardsContext.tsx`

**Step 1: Create the RewardsContext**

Port from photobooth `src/context/RewardsContext.tsx` with these adaptations:

1. **Auth hook:** Change `useSogniAuth()` import from `'../services/sogniAuth'` to `'@/services/sogniAuth'`
2. **Toast hook:** Change `useToastContext()` to `useToast()` from `'@/context/ToastContext'`. The makeover toast API uses `showToast(message, type, duration)` instead of `showToast({ title, message, type })`. Adapt all toast calls:
   - Success: `showToast('Reward Claimed! +{amount} credits', 'success')`
   - Error: `showToast(errorMessage, 'error')`
3. **Turnstile import:** `import Turnstile from 'react-turnstile'`
4. **Turnstile key:** `import { getTurnstileKey } from '@/config/env'`
5. **Sonic logos:** `import { playSogniSignatureIfEnabled } from '@/utils/sonicLogos'`
6. **Remove `useApp` dependency:** The photobooth uses `const { settings } = useApp()` for `settings.soundEnabled`. The makeover `AppSettings` does NOT have `soundEnabled`. For now, always pass `true` to `playSogniSignatureIfEnabled(true)`.
7. **Reward type import:** `import type { Reward } from '@/types/rewards'`

Keep the core logic identical:
- `fetchRewards` with rate limit backoff
- `claimReward` / `claimRewardWithToken` / `resetClaimState`
- Turnstile modal rendered inside the provider
- The `isClaimable` / `isTimeLocked` helper functions

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Lint check**

```bash
npm run lint
```

**Step 4: Commit**

```bash
git add src/context/RewardsContext.tsx
git commit -m "feat: add RewardsContext for daily boost claims"
```

---

## Task 7: Create DailyBoostCelebration Component

**Files:**
- Create: `src/components/shared/DailyBoostCelebration.tsx`
- Create: `src/components/shared/DailyBoostCelebration.css`

**Step 1: Create the DailyBoostCelebration component**

Port from photobooth `src/components/shared/DailyBoostCelebration.tsx` with these adaptations:

1. **Turnstile import:** `import Turnstile from 'react-turnstile'`
2. **Turnstile key:** `import { getTurnstileKey } from '@/config/env'`
3. **ConfettiCelebration import:** `import ConfettiCelebration from './ConfettiCelebration'`
4. **CSS import:** `import './DailyBoostCelebration.css'`

The component logic is self-contained and needs no other changes. It receives all data via props.

**Step 2: Copy the CSS file**

Copy directly from photobooth `src/components/shared/DailyBoostCelebration.css` — no changes needed.

**Step 3: Verify TypeScript compiles and lint passes**

```bash
npx tsc --noEmit && npm run lint
```

**Step 4: Commit**

```bash
git add src/components/shared/DailyBoostCelebration.tsx src/components/shared/DailyBoostCelebration.css
git commit -m "feat: add DailyBoostCelebration modal component"
```

---

## Task 8: Wire RewardsProvider and Daily Boost Auto-Show into App

**Files:**
- Modify: `src/App.tsx:49-57` (App component — provider hierarchy)
- Modify: `src/App.tsx:16-47` (AppContent — auto-show logic)

**Step 1: Add RewardsProvider to the provider hierarchy**

In `src/App.tsx`, wrap `<AppContent />` with `<RewardsProvider>`:

```typescript
import { RewardsProvider } from '@/context/RewardsContext';

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
```

**Step 2: Add Daily Boost auto-show logic in AppContent**

In the `AppContent` component, add:

```typescript
import { useRewards } from '@/context/RewardsContext';
import DailyBoostCelebration from '@/components/shared/DailyBoostCelebration';

function AppContent() {
  const { currentView, authState } = useApp();
  const { rewards, loading: rewardsLoading, claimInProgress, lastClaimSuccess, claimRewardWithToken, resetClaimState, error: rewardsError } = useRewards();
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showDailyBoost, setShowDailyBoost] = useState(false);

  // Find the Daily Boost reward (id "2")
  const dailyBoostReward = rewards.find(r => r.id === '2');
  const canClaimDailyBoost = dailyBoostReward?.canClaim &&
    (!dailyBoostReward?.nextClaim || dailyBoostReward.nextClaim.getTime() <= Date.now());

  // Auto-show Daily Boost celebration when claimable
  useEffect(() => {
    if (!authState.isAuthenticated || rewardsLoading || rewards.length === 0) return;
    if (!canClaimDailyBoost) return;
    setShowDailyBoost(true);
  }, [authState.isAuthenticated, rewardsLoading, rewards.length]);
  // Note: canClaimDailyBoost intentionally omitted per useEffect rules —
  // it's derived from rewards which is already tracked via rewards.length

  // ... existing email verification effect ...

  return (
    <div className="...">
      {/* ... existing content ... */}

      {/* Daily Boost Celebration */}
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
    </div>
  );
}
```

**Step 3: Verify TypeScript compiles, lint passes, useEffect validation passes**

```bash
npx tsc --noEmit && npm run lint && npm run validate:useeffect
```

**Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire RewardsProvider and Daily Boost auto-show"
```

---

## Task 9: Create Stripe Service

**Files:**
- Create: `src/services/stripe.ts`

**Step 1: Create the Stripe API service**

Port from photobooth `src/services/stripe.ts` with these adaptations:

1. **Import change:** Replace `import { SogniClient, TokenType } from '@sogni-ai/sogni-client'` with just `import type { SogniClient } from '@sogni-ai/sogni-client'`. For `TokenType`, import from the local wallet types: `import type { TokenType } from '@/types/wallet'`.
2. **`startPurchase` changes:** Update `redirectType` and `appSource`:
   ```typescript
   export async function startPurchase(api: SogniClient, productId: string): Promise<PurchaseIntent> {
     const response = await api.apiClient.rest.post<PurchaseResponse>('/v1/iap/stripe/purchase', {
       productId,
       redirectType: 'makeover',
       appSource: 'sogni-makeover'
     });
     return { ...response.data, productId };
   }
   ```
3. Everything else (types, `getStripeProducts`, `getPurchase`, `formatUSD`) is identical.

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/services/stripe.ts
git commit -m "feat: add Stripe payment service"
```

---

## Task 10: Create useApiAction and useApiQuery Hooks

**Files:**
- Create: `src/hooks/useApiAction.ts`
- Create: `src/hooks/useApiQuery.ts`
- Create: `src/hooks/useSogniApi.ts`

The photobooth uses `useApiAction`, `useApiQuery`, and `useSogniApi` hooks. The makeover app doesn't have an `ApiProvider` context — it accesses the SDK via `useSogniAuth().getSogniClient()`. We need to create equivalent hooks.

**Step 1: Create `useSogniApi.ts`**

Instead of a context-based approach, create a hook that gets the client from `sogniAuth`:

```typescript
import { useSogniAuth } from '@/services/sogniAuth';
import type { SogniClient } from '@sogni-ai/sogni-client';

export function useSogniApi(): SogniClient {
  const { getSogniClient } = useSogniAuth();
  const client = getSogniClient();
  if (!client) {
    throw new Error('useSogniApi: SogniClient not available. User must be authenticated.');
  }
  return client;
}

export default useSogniApi;
```

**Step 2: Create `useApiAction.ts`**

Port directly from photobooth `src/hooks/useApiAction.ts`, changing the `useSogniApi` import path:

```typescript
import type { SogniClient } from '@sogni-ai/sogni-client';
import { useCallback, useState } from 'react';
import useSogniApi from './useSogniApi';

interface State<R> {
  loading: boolean;
  error: string | null;
  data: R | null;
}

type Action<P, R> =
  | ((api: SogniClient, params: P) => Promise<R>)
  | ((api: SogniClient) => Promise<R>);

function useApiAction<A extends Action<any, any>, P = Parameters<A>[1], R = Awaited<ReturnType<A>>>(
  action: A
) {
  const api = useSogniApi();
  const [state, setState] = useState<State<R>>({
    loading: false,
    error: null,
    data: null
  });

  const execute = useCallback(
    async (params?: P): Promise<R | undefined> => {
      setState({ loading: true, error: null, data: null });
      return action(api, params)
        .then((data) => {
          setState({ loading: false, error: null, data });
          return data;
        })
        .catch((e) => {
          console.error(e);
          setState({ loading: false, error: e.message, data: null });
        });
    },
    [action, api]
  );

  const reset = useCallback(() => {
    setState({ loading: false, error: null, data: null });
  }, []);

  return { ...state, execute, reset };
}

export default useApiAction;
```

**Step 3: Create `useApiQuery.ts`**

Port directly from photobooth `src/hooks/useApiQuery.ts`:

```typescript
import type { SogniClient } from '@sogni-ai/sogni-client';
import { useEffect } from 'react';
import useApiAction from './useApiAction';

function useApiQuery<R = unknown>(fetchData: (api: SogniClient) => Promise<R>) {
  const { loading, error, data, execute } = useApiAction(fetchData);
  useEffect(() => {
    execute();
  }, [execute]);
  return { loading, error, data, refresh: execute };
}

export default useApiQuery;
```

**Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 5: Commit**

```bash
git add src/hooks/useSogniApi.ts src/hooks/useApiAction.ts src/hooks/useApiQuery.ts
git commit -m "feat: add API action/query hooks for Stripe integration"
```

---

## Task 11: Create useSparkPurchase Hook

**Files:**
- Create: `src/hooks/useSparkPurchase.ts`

**Step 1: Create the hook**

Port from photobooth `src/hooks/useSparkPurchase.ts` with import path changes:

```typescript
import { useCallback, useEffect } from 'react';
import type { SogniClient } from '@sogni-ai/sogni-client';
import useApiAction from './useApiAction';
import useApiQuery from './useApiQuery';
import { getPurchase, getStripeProducts, startPurchase } from '@/services/stripe';

function useSparkPurchase() {
  const { data: products, error: productsError } = useApiQuery(getStripeProducts);
  const {
    data: purchaseIntent,
    loading: intentLoading,
    error: intentError,
    execute: makePurchase,
    reset: resetIntent
  } = useApiAction(startPurchase);
  const purchaseId = purchaseIntent?.purchaseId;
  const fetchPurchaseStatus = useCallback(
    async (api: SogniClient) => {
      if (!purchaseId) return null;
      return getPurchase(api, purchaseId);
    },
    [purchaseId]
  );
  const {
    data: purchaseStatus,
    loading: loadingStatus,
    error: statusError,
    execute: refreshStatus,
    reset: resetStatus
  } = useApiAction(fetchPurchaseStatus);

  const reset = useCallback(() => {
    resetIntent();
    resetStatus();
  }, [resetIntent, resetStatus]);

  useEffect(() => {
    if (productsError) {
      console.error('Failed to load products:', productsError);
    }
  }, [productsError]);

  useEffect(() => {
    if (intentError) {
      console.error('Purchase failed:', intentError);
      resetIntent();
    }
  }, [intentError, resetIntent]);

  useEffect(() => {
    if (statusError) {
      console.error('Purchase status check failed:', statusError);
      resetStatus();
    }
  }, [statusError, resetStatus]);

  return {
    products,
    purchaseIntent,
    purchaseStatus,
    makePurchase,
    refreshStatus,
    loading: loadingStatus || intentLoading,
    reset
  };
}

export default useSparkPurchase;
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

**Step 3: Commit**

```bash
git add src/hooks/useSparkPurchase.ts
git commit -m "feat: add useSparkPurchase hook"
```

---

## Task 12: Create Stripe UI Components

**Files:**
- Create: `src/components/stripe/StripePurchase.tsx`
- Create: `src/components/stripe/ProductList.tsx`
- Create: `src/components/stripe/PurchaseProgress.tsx`
- Create: `src/styles/stripe/StripePurchase.css`
- Create: `src/styles/stripe/ProductList.css`
- Copy: `src/components/stripe/bg.jpg` (background image from photobooth)

**Step 1: Copy the background image**

```bash
cp /Users/markledford/Documents/git/sogni-photobooth/src/components/stripe/bg.jpg src/components/stripe/bg.jpg
```

**Step 2: Create StripePurchase.tsx**

Port from photobooth `src/components/stripe/StripePurchase.tsx`. Change import paths only:

- `'../../styles/stripe/StripePurchase.css'` → `'@/styles/stripe/StripePurchase.css'`
- `'./ProductList'` → `'./ProductList'` (same)
- `'./PurchaseProgress'` → `'./PurchaseProgress'` (same)
- `'../../hooks/useSparkPurchase'` → `'@/hooks/useSparkPurchase'`

Logic is identical.

**Step 3: Create ProductList.tsx**

Port from photobooth `src/components/stripe/ProductList.tsx`. Change import paths:

- `'../../services/stripe'` → `'@/services/stripe'`
- `'../../styles/stripe/ProductList.css'` → `'@/styles/stripe/ProductList.css'`
- Swiper imports remain the same: `'swiper/react'`, `'swiper/modules'`, `'swiper/css'`

Logic and SVG icons are identical.

**Step 4: Create PurchaseProgress.tsx**

Port from photobooth `src/components/stripe/PurchaseProgress.tsx` with adaptations:

- `'../../services/stripe'` → `'@/services/stripe'`
- `'../../styles/stripe/PurchaseProgress.css'` — this file was empty in photobooth (styles are in ProductList.css). Create the import but reference the ProductList CSS which contains the progress styles.
- **Remove analytics imports:** The makeover app has no `trackPurchase`, `trackEvent`, `getCampaignSource`, or `getReferralSource` utilities. Remove all analytics tracking from the completion effect. Keep only the sonic logo playback.
- **Remove `useApp` dependency:** Replace `const { settings } = useApp()` with direct `true` for sound: `playSogniSignatureIfEnabled(true)`.
- **Sonic logo import:** `import { playSogniSignatureIfEnabled } from '@/utils/sonicLogos'`

Simplified completion effect:

```typescript
useEffect(() => {
  if (isCompleted && productId && !hasPlayedSoundRef.current) {
    hasPlayedSoundRef.current = true;
    playSogniSignatureIfEnabled(true);
  }
}, [isCompleted, productId]);
```

**Step 5: Copy CSS files**

Copy from photobooth:
- `src/styles/stripe/StripePurchase.css` — direct copy
- `src/styles/stripe/ProductList.css` — direct copy (includes PurchaseProgress styles)

The CSS references `bg.jpg` via relative path `../../components/stripe/bg.jpg`. This will work since our directory structure matches.

**Step 6: Verify TypeScript compiles and lint passes**

```bash
npx tsc --noEmit && npm run lint
```

**Step 7: Commit**

```bash
git add src/components/stripe/ src/styles/stripe/
git commit -m "feat: add Stripe purchase UI components"
```

---

## Task 13: Add Buy Spark Button to UserMenu

**Files:**
- Modify: `src/components/layout/UserMenu.tsx`

**Step 1: Add onPurchaseClick prop and Buy Spark button**

Add a prop for the purchase callback and a "Buy Spark" button in the dropdown between the balance display and the payment method toggle:

```typescript
interface UserMenuProps {
  onPurchaseClick?: () => void;
}

function UserMenu({ onPurchaseClick }: UserMenuProps) {
  // ... existing code ...

  const handlePurchase = () => {
    setIsOpen(false);
    onPurchaseClick?.();
  };

  // In the JSX, after the balance display section and before the payment method toggle:
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
```

**Step 2: Update Header.tsx to pass onPurchaseClick**

The Header needs to pass the callback down. Read `src/components/layout/Header.tsx` to find where `<UserMenu />` is rendered and add the prop.

**Step 3: Wire it up in AppContent (App.tsx)**

Add `showStripePurchase` state and pass it down through Header → UserMenu:

```typescript
// In AppContent:
const [showStripePurchase, setShowStripePurchase] = useState(false);

// Pass to Header (which passes to UserMenu):
<Header onPurchaseClick={
  authState.isAuthenticated && authState.authMode === 'frontend'
    ? () => setShowStripePurchase(true)
    : undefined
} />

// Render StripePurchase modal:
{showStripePurchase && (
  <StripePurchase onClose={() => setShowStripePurchase(false)} />
)}
```

Note: The StripePurchase component uses `useSogniApi()` internally which gets the client from `useSogniAuth()`. No wrapper needed since the user must be authenticated.

**Step 4: Verify TypeScript compiles, lint passes, useEffect validation**

```bash
npx tsc --noEmit && npm run lint && npm run validate:useeffect
```

**Step 5: Commit**

```bash
git add src/components/layout/UserMenu.tsx src/components/layout/Header.tsx src/App.tsx
git commit -m "feat: add Buy Spark button to UserMenu and wire Stripe modal"
```

---

## Task 14: Add Daily Boost Indicator to UserMenu

**Files:**
- Modify: `src/components/layout/UserMenu.tsx`

**Step 1: Add Daily Boost indicator**

Add a pulsing indicator and manual claim option in the UserMenu dropdown:

```typescript
import { useRewards } from '@/context/RewardsContext';

function UserMenu({ onPurchaseClick }: UserMenuProps) {
  const { rewards, claimReward } = useRewards();

  // Find daily boost reward
  const dailyBoostReward = rewards.find(r => r.id === '2');
  const canClaimDailyBoost = dailyBoostReward?.canClaim &&
    (!dailyBoostReward?.nextClaim || dailyBoostReward.nextClaim.getTime() <= Date.now());

  // In the JSX, add a Daily Boost button after the Buy Spark button:
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
```

**Step 2: Verify TypeScript compiles, lint passes, useEffect validation**

```bash
npx tsc --noEmit && npm run lint && npm run validate:useeffect
```

**Step 3: Commit**

```bash
git add src/components/layout/UserMenu.tsx
git commit -m "feat: add Daily Boost claim indicator to UserMenu"
```

---

## Task 15: Manual Testing & Verification

**Step 1: Start the development server**

```bash
# Terminal 1:
cd server && npm run dev

# Terminal 2:
npm run dev
```

**Step 2: Test Daily Boost (authenticated user)**

1. Navigate to `https://makeover-local.sogni.ai`
2. Log in with a Sogni account
3. Verify: Daily Boost celebration modal auto-appears if boost is available
4. Click "CLAIM NOW!" → Turnstile verification → confirm success animation
5. Check: Balance updates in UserMenu after claim
6. Open UserMenu → verify Daily Boost indicator is gone (already claimed)
7. Close and reopen → verify modal doesn't reappear

**Step 3: Test Stripe Purchase (authenticated user)**

1. Open UserMenu → click "Buy Spark"
2. Verify: Product carousel appears with packages
3. Swipe between products
4. Click "Get X Premium Spark for $Y.YY"
5. Verify: Stripe Checkout opens in new tab
6. In modal: verify "Waiting for Stripe" status shows
7. Click "Check status" to poll
8. Complete purchase in Stripe tab → verify success message

**Step 4: Test unauthenticated state**

1. Log out
2. Verify: No Daily Boost modal appears
3. Verify: No "Buy Spark" button in header/menu
4. Verify: No console errors

**Step 5: Run full validation suite**

```bash
npx tsc --noEmit && npm run lint && npm run validate:useeffect
```

**Step 6: Commit any fixes from testing**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```

---

## Task Summary

| Task | Description | Dependencies |
|------|-------------|--------------|
| 1 | Install swiper + react-turnstile | None |
| 2 | Create Reward types | None |
| 3 | Add Turnstile config utility | None |
| 4 | Create sonic logo utility | None |
| 5 | Create ConfettiCelebration component | None |
| 6 | Create RewardsContext provider | Tasks 2, 3, 4 |
| 7 | Create DailyBoostCelebration component | Tasks 3, 5 |
| 8 | Wire RewardsProvider + auto-show into App | Tasks 6, 7 |
| 9 | Create Stripe service | Task 2 (for TokenType) |
| 10 | Create useApiAction/useApiQuery hooks | None |
| 11 | Create useSparkPurchase hook | Tasks 9, 10 |
| 12 | Create Stripe UI components | Tasks 4, 11 |
| 13 | Add Buy Spark to UserMenu + wire modal | Tasks 8, 12 |
| 14 | Add Daily Boost indicator to UserMenu | Task 8 |
| 15 | Manual testing & verification | All above |

**Parallelizable groups:**
- Tasks 1-5 are all independent
- Tasks 6, 7, 9, 10 can run in parallel after their deps
- Tasks 8, 11 are the merge points
- Tasks 12-14 are sequential
