# Job Cost Estimation & Display — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show authenticated users their token balance in the header and a per-transformation cost estimate in the studio toolbar before they submit jobs.

**Architecture:** New `useMakeoverCostEstimate` hook calls the Sogni SDK's `estimateCost()` directly for authenticated users. The header's `UserMenu` trigger button gets an inline balance display. The studio toolbar gets a right-aligned cost badge. Unauthenticated users see no cost info.

**Tech Stack:** React 18, TypeScript, Sogni Client SDK (`estimateCost`), existing `useWallet` hook, existing `walletService` utilities.

---

### Task 1: Create `useMakeoverCostEstimate` Hook

**Files:**
- Create: `src/hooks/useMakeoverCostEstimate.ts`

**Step 1: Create the hook file**

```typescript
import { useState, useEffect, useRef } from 'react';
import { useSogniAuth } from '@/services/sogniAuth';
import { useWallet } from '@/hooks/useWallet';
import { useApp } from '@/context/AppContext';

interface MakeoverCostEstimate {
  tokenCost: number | null;
  usdCost: number | null;
  isLoading: boolean;
  error: string | null;
}

export function useMakeoverCostEstimate(): MakeoverCostEstimate {
  const { isAuthenticated, authMode, getSogniClient } = useSogniAuth();
  const { tokenType } = useWallet();
  const { settings } = useApp();
  const [tokenCost, setTokenCost] = useState<number | null>(null);
  const [usdCost, setUsdCost] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || authMode === 'demo') {
      setTokenCost(null);
      setUsdCost(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const sogniClient = getSogniClient();
    if (!sogniClient?.projects) {
      return;
    }

    abortRef.current = false;
    setIsLoading(true);
    setError(null);

    (sogniClient.projects as any)
      .estimateCost({
        network: 'fast',
        tokenType,
        model: settings.defaultModel,
        imageCount: 1,
        stepCount: settings.defaultSteps,
        previewCount: 0,
        cnEnabled: false,
        startingImageStrength: 0.5,
        width: settings.defaultWidth,
        height: settings.defaultHeight,
        guidance: settings.defaultGuidance,
        sampler: settings.defaultSampler,
        contextImages: 1,
      })
      .then((result: { token: string; usd: string }) => {
        if (abortRef.current) return;
        setTokenCost(parseFloat(result.token));
        setUsdCost(parseFloat(result.usd));
        setIsLoading(false);
      })
      .catch((err: Error) => {
        if (abortRef.current) return;
        console.warn('Cost estimation failed:', err.message);
        setError(err.message);
        setIsLoading(false);
      });

    return () => {
      abortRef.current = true;
    };
  }, [isAuthenticated, authMode, tokenType, settings.defaultModel, settings.defaultSteps, settings.defaultWidth, settings.defaultHeight, settings.defaultGuidance, settings.defaultSampler]);

  return { tokenCost, usdCost, isLoading, error };
}
```

**Step 2: Verify lint passes**

Run: `npm run lint -- --no-warn-ignored 2>&1 | head -20`
Expected: No errors in the new file.

**Step 3: Commit**

```bash
git add src/hooks/useMakeoverCostEstimate.ts
git commit -m "feat: add useMakeoverCostEstimate hook for SDK-direct cost estimation"
```

---

### Task 2: Add Balance Display to UserMenu Trigger Button

**Files:**
- Modify: `src/components/layout/UserMenu.tsx`

**Step 1: Add balance to the trigger button**

The trigger button is at line 97-111 of `UserMenu.tsx`. Currently shows just `{username}` and a chevron.

Add the `useWallet` balance display (hook is already imported at line 7) inline with the username. The `balanceDisplay` variable already exists at line 88-90.

Replace the trigger button (lines 97-111):

```typescript
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
```

Key details:
- `sm:inline` + `hidden` — balance only shows on screens >= 640px, keeping mobile clean
- Pipe separator in `text-white/20` — very subtle
- Balance in `text-primary-300/70` at 11px — matches app accent but stays muted

**Step 2: Verify lint passes**

Run: `npm run lint -- --no-warn-ignored 2>&1 | head -20`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/layout/UserMenu.tsx
git commit -m "feat: show token balance next to username in header"
```

---

### Task 3: Add Cost Estimate Badge to Studio Toolbar

**Files:**
- Modify: `src/components/studio/MakeoverStudio.tsx`

**Step 1: Import the hook and wallet utilities**

Add to the imports at the top of `MakeoverStudio.tsx`:

```typescript
import { useMakeoverCostEstimate } from '@/hooks/useMakeoverCostEstimate';
import { useWallet } from '@/hooks/useWallet';
import { formatTokenAmount, getTokenLabel } from '@/services/walletService';
```

**Step 2: Use the hooks in the component**

Inside `MakeoverStudio`, after the existing destructuring of `useApp()` (after line 35), add:

```typescript
  const { tokenCost, usdCost, isLoading: costLoading } = useMakeoverCostEstimate();
  const { tokenType } = useWallet();
```

**Step 3: Add the cost badge to the toolbar**

The toolbar is the `<div>` at lines 150-218 (the one with `className="flex flex-shrink-0 items-center gap-2 ..."`).

After the closing of the last element inside the toolbar div (the transformation name display, around line 217), but still inside the toolbar div, add the cost badge with a spacer:

Replace the toolbar div opening (line 150) to add `justify-between` or use a `ml-auto` spacer. Actually, looking at the structure, the simplest approach: wrap existing left-side content in a div, add cost badge as a right-side element.

Replace the toolbar div (lines 150-218) with:

```typescript
            <div className="flex flex-shrink-0 items-center justify-between border-b border-primary-400/[0.06] px-3 py-1.5">
              {/* Left: navigation and mode controls */}
              <div className="flex items-center gap-2">
              <button
                onClick={handleBack}
                className="flex items-center gap-1 text-xs text-white/35 transition-colors hover:text-white/60"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                </svg>
                New Photo
              </button>
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
              {editStack.hasSteps && (
                <>
                  <span className="text-[10px] text-white/10">|</span>
                  <div className="flex items-center rounded-full border border-primary-400/[0.06] bg-surface-900/40">
                    <button
                      onClick={() => editStack.setMode('original')}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        editStack.mode === 'original'
                          ? 'bg-primary-400/15 text-primary-300'
                          : 'text-white/35 hover:text-white/60'
                      }`}
                    >
                      Original
                    </button>
                    <button
                      onClick={() => editStack.setMode('stacked')}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors ${
                        editStack.mode === 'stacked'
                          ? 'bg-primary-400/15 text-primary-300'
                          : 'text-white/35 hover:text-white/60'
                      }`}
                    >
                      Stacked
                    </button>
                  </div>
                </>
              )}
              {(() => {
                const displayTransformation = editStack.currentStep?.transformation ?? currentTransformation;
                if (!displayTransformation) return null;
                return (
                  <>
                    <span className="text-[10px] text-white/10">|</span>
                    <span className="text-[11px] text-primary-300/70">
                      {displayTransformation.icon} {displayTransformation.name}
                      {editStack.stepCount > 1 && (
                        <span className="ml-1 text-white/25">
                          ({Math.max(0, editStack.currentIndex + 1)} of {editStack.stepCount})
                        </span>
                      )}
                    </span>
                  </>
                );
              })()}
              </div>

              {/* Right: cost estimate */}
              {authState.isAuthenticated && (
                <div className="hidden items-center gap-1 sm:flex">
                  {costLoading ? (
                    <span className="text-[10px] text-white/25">...</span>
                  ) : tokenCost !== null ? (
                    <>
                      <span className="text-[10px] text-white/30">~</span>
                      <span className="text-[10px] font-medium text-white/50">
                        {formatTokenAmount(tokenCost)} {getTokenLabel(tokenType)}
                      </span>
                      {usdCost !== null && (
                        <span className="text-[10px] text-white/25">
                          ≈ ${usdCost.toFixed(2)}
                        </span>
                      )}
                    </>
                  ) : null}
                </div>
              )}
            </div>
```

Key details:
- `justify-between` on the toolbar to push cost to the right
- Left content wrapped in a `<div className="flex items-center gap-2">`
- Cost badge: `hidden sm:flex` — only on screens >= 640px
- Very subtle: 10px text, `text-white/50` for cost, `text-white/25` for USD

**Step 4: Verify lint passes**

Run: `npm run lint -- --no-warn-ignored 2>&1 | head -20`
Expected: No errors.

**Step 5: Verify useEffect validation passes**

Run: `npm run validate:useeffect 2>&1 | head -20`
Expected: No violations.

**Step 6: Commit**

```bash
git add src/components/studio/MakeoverStudio.tsx
git commit -m "feat: show estimated job cost in studio toolbar"
```

---

### Task 4: Manual Verification

**Step 1: Start dev servers and verify**

1. Start backend: `cd server && npm run dev`
2. Start frontend: `npm run dev`
3. Open `https://makeover-local.sogni.ai`

**Verify as authenticated user:**
- [ ] Header shows: `username | 1,234 Spark ▾` (balance next to name)
- [ ] Studio toolbar shows cost on right: `~0.12 Spark ≈ $0.01`
- [ ] Switching payment method (SOGNI/Spark) updates both balance and cost
- [ ] Switching model in settings updates cost estimate
- [ ] Cost shows `...` briefly while loading
- [ ] On mobile width (< 640px): balance hidden from header trigger, cost hidden from toolbar

**Verify as demo/logged-out user:**
- [ ] No balance in header (shows Log In / Sign Up buttons)
- [ ] No cost in studio toolbar
- [ ] Demo banner still shows remaining generations

**Step 2: Build check**

Run: `npm run build`
Expected: Clean build with no TypeScript errors.

**Step 3: Final commit (if any fixups needed)**

```bash
git add -A
git commit -m "fix: address cost estimation review feedback"
```
