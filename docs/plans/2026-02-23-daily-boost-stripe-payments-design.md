# Daily Boost & Stripe Payments Design

## Overview

Add Daily Boost reward claiming and Stripe credit card purchases to the makeover app, ported from the photobooth reference implementation. Both features are authenticated-only and use direct Sogni SDK/API calls (no backend changes).

## Decisions

- **Auth gating**: Authenticated users only
- **Daily Boost UX**: Auto-show celebration modal on login when boost is claimable
- **Buy Credits placement**: Inside UserMenu dropdown
- **API approach**: Direct SDK calls via `sogniClient` — no backend proxy
- **Port style**: Port photobooth components, adapt to makeover's TypeScript/styling conventions

## Feature 1: Daily Boost

### New Files

| File | Purpose |
|------|---------|
| `src/types/rewards.ts` | `Reward` interface |
| `src/context/RewardsContext.tsx` | `RewardsProvider` + `useRewards()` hook |
| `src/components/shared/DailyBoostCelebration.tsx` | Claim modal with celebration UI |
| `src/components/shared/DailyBoostCelebration.css` | Styling |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Wrap with `RewardsProvider`, wire auto-show logic |
| `src/components/layout/UserMenu.tsx` | Add Daily Boost badge/manual claim button |

### Data Flow

```
User authenticates
  → RewardsProvider fetches rewards via sogniClient.account.rewards()
  → Finds reward id "2" (Daily Boost)
  → Checks canClaim && nextClaim <= now
  → Auto-shows DailyBoostCelebration modal
  → User clicks "CLAIM NOW!"
  → Turnstile verification
  → sogniClient.account.claimRewards(['2'], { turnstileToken })
  → Success: confetti, animated counter, toast, balance auto-updates
```

### RewardsContext API

```typescript
interface RewardsContextValue {
  rewards: Reward[];
  rewardsLoading: boolean;
  fetchRewards: () => Promise<void>;
  claimReward: (id: string, skipTurnstile?: boolean) => void;
  claimRewardWithToken: (id: string, turnstileToken: string) => void;
  claimInProgress: boolean;
  lastClaimSuccess: boolean;
  claimIntent: { id: string; skipTurnstile: boolean } | null;
}
```

### Reward Type

```typescript
interface Reward {
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

## Feature 2: Stripe Credit Purchases

### New Files

| File | Purpose |
|------|---------|
| `src/services/stripe.ts` | API functions: `getStripeProducts()`, `startPurchase()`, `getPurchase()` |
| `src/hooks/useSparkPurchase.ts` | Purchase state management hook |
| `src/components/stripe/StripePurchase.tsx` | Modal container |
| `src/components/stripe/ProductList.tsx` | Swiper carousel of credit packages |
| `src/components/stripe/ProductList.css` | Styling |
| `src/components/stripe/PurchaseProgress.tsx` | Status polling + success display |
| `src/components/stripe/PurchaseProgress.css` | Styling |
| `src/styles/stripe/StripePurchase.css` | Modal styling |

### Modified Files

| File | Change |
|------|--------|
| `src/components/layout/UserMenu.tsx` | Add "Buy Spark" button |
| `src/App.tsx` | Add `showStripePurchase` state, render modal |

### API Endpoints (Sogni API)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/v1/iap/stripe/products` | GET | List products with prices, discounts, spark values |
| `/v1/iap/stripe/purchase` | POST | Create checkout session, returns Stripe URL |
| `/v1/iap/status/{purchaseId}` | GET | Poll purchase completion status |

### Purchase Flow

```
User clicks "Buy Spark" in UserMenu
  → Opens StripePurchase modal
  → useSparkPurchase fetches products
  → ProductList renders Swiper carousel
  → User selects package, clicks CTA
  → startPurchase({ productId, redirectType: 'makeover', appSource: 'sogni-makeover' })
  → Stripe Checkout opens in new tab
  → BroadcastChannel('sogni-purchase-status') notifies on completion
  → OR user clicks "Check Status" manually
  → getPurchase() polls until status === 'completed'
  → Success: analytics, balance updates, toast
```

### Product Processing

Products fetched from API are processed to calculate:
- Price per token ratio
- Discount percentage vs most expensive option
- Default product (2000 tokens)
- Display name formatting (e.g., "2K", "10K")

## Integration: Provider Hierarchy

```
<ToastProvider>
  <AppProvider>
    <RewardsProvider>   ← NEW
      <AppContent />
    </RewardsProvider>
  </AppProvider>
</ToastProvider>
```

## Dependencies to Add

- `swiper` — Product carousel component
- `@marfusios/react-turnstile` (or equivalent already used in photobooth) — Cloudflare Turnstile captcha

## Security

- Turnstile verification required for Daily Boost claims (bot protection)
- No card data handled by our app — Stripe Checkout handles PCI compliance
- All payment processing server-side via Sogni API
- Purchase intent creation requires authenticated session (cookies)

## Analytics

- GA4 ecommerce purchase event on Stripe success (transaction_id, value, currency, items)
- Campaign source and referral tracking on purchase completion
