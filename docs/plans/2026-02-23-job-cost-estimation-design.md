# Job Cost Estimation & Display

## Problem

Authenticated users have no visibility into job costs before submitting transformations. The infrastructure exists (backend endpoint, `useCostEstimation` hook, SDK `estimateCost()` method) but nothing is wired to the UI.

## Design

### 1. Header Balance Display

Show the active token balance inline with the username in the `UserMenu` trigger button.

- **Current:** `username ▾`
- **Proposed:** `username | 1,234 Spark ▾`
- Pipe separator in `text-white/20`, balance in `text-primary-300/70`
- Only for authenticated non-demo users
- Uses `formatTokenAmount()` + `getTokenLabel()` from walletService
- On small screens, hide balance from trigger (still visible in dropdown)

### 2. Inline Cost Estimate in Studio Toolbar

Right-aligned in the existing toolbar row in `MakeoverStudio.tsx`.

**Display format:** `~0.12 Spark ≈ $0.01`

- Subtle styling: 10-11px text, `text-white/35` for labels, slightly brighter for token amount
- Shows `...` while loading, formatted cost when ready, hidden on error
- Fetches once on mount + re-fetches when settings or payment method change
- All transformations share the same model/dimensions/steps so one estimate covers all

### 3. Dual-Path Estimation Hook: `useMakeoverCostEstimate`

New hook that abstracts over both authenticated and unauthenticated paths.

**Authenticated users (SDK direct):** Calls `sogniClient.projects.estimateCost()` with current settings (model, steps, width, height, guidance, sampler, contextImages: 1, tokenType).

**Unauthenticated users:** Returns null (no cost display; they see demo generation count instead).

**Returns:**
```typescript
{
  tokenCost: number | null;    // Cost in selected token type
  usdCost: number | null;      // Cost in USD
  isLoading: boolean;
  error: string | null;
}
```

### 4. Reactive Data Flow

```
Settings change (model, steps, etc.) or payment method toggle
  -> useMakeoverCostEstimate re-fetches estimate
    -> Toolbar badge updates
    -> Header balance already reactive via useWallet/useEntity
```

### 5. Scope Boundaries

- **In scope:** Header balance display, toolbar cost badge, new estimation hook
- **Out of scope:** Confirmation dialogs, post-generation cost display, history cost tracking, demo user cost preview
