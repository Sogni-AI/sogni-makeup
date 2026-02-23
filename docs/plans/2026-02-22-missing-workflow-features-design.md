# Missing Workflow Features Design

**Date:** 2026-02-22
**Status:** Approved

## Context

Sogni Makeover is missing several basic workflow features that Sogni Photobooth already provides. This design covers 7 identified gaps.

## Features

### 1. Logout via User Menu Dropdown

Replace the static username span in `Header.tsx` with a clickable dropdown menu.

**Trigger:** Click the username area (styled as a button with subtle hover state).

**Dropdown contents:**
- `@username` label
- Balance display (token amount from SDK)
- Payment method toggle (Sogni Token / Spark Points)
- Divider
- "Log Out" button

**Logout action flow:**
1. Call `sogniAuth.logout()`
2. Auth state listener resets `sogniClient` to null in AppContext
3. Cancel any in-progress generation
4. Navigate to landing view
5. Show "Logged out" success toast

**Close on:** click outside, ESC, or selecting an action.
**Loading state:** "Logging out..." text while `isLoading` during logout.

Expose a `logout` action from `AppContext` that orchestrates the full cleanup.

### 2. History UI

Add a `'history'` value to the `AppView` type. New `HistoryView` component showing a grid of past makeovers.

**Accessible from:** "History" link in the user dropdown menu AND a button in the studio toolbar.

**Each item shows:** result thumbnail, transformation name, timestamp.

**Actions:**
- Click an item to open comparison view for that history entry
- "Clear History" button at the bottom

**Data source:** existing `history` state in AppContext (already persisted in cookies).

### 3. Balance Display

Shown inside the user menu dropdown (above logout).

**Implementation:** Use Sogni Client SDK's `account` to read balance. Format: `123.45 Sogni Tokens` or `500 Spark Points` depending on active payment method.

Updates when the menu opens (one-shot fetch, not polling).

### 4. Payment Method Toggle

Two small toggle buttons in the user menu: "Sogni Token" / "Spark Points". Active one highlighted with primary color.

Calls SDK wallet method to switch. Balance display updates accordingly.

### 5. Settings Reset

Add a `resetSettings` action to `AppContext`. "Reset Settings" button in user menu dropdown.

Resets `settings` state back to `DEFAULT_SETTINGS`.

### 6. Session Transfer Notification

The `sessionTransferred` flag and error message already exist in `sogniAuth`.

Add `sessionTransferred` boolean to `AuthState`. When true, show a persistent warning banner below the header with the existing error message and a "Refresh" button that calls `window.location.reload()`.

New component: `SessionTransferBanner`.

### 7. Email Verification Guidance

Listen for the `sogni-email-verification-required` custom event (already dispatched by `sogniAuth`).

Show a modal with:
- Message: "Please verify your email at app.sogni.ai to continue"
- Link button to `https://app.sogni.ai` (opens in new tab)
- "I've verified, try again" button that calls `sogniAuth.checkExistingSession()`

New component: `EmailVerificationModal`.

## Files to Modify

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `'history'` to AppView, add `sessionTransferred` to AuthState |
| `src/components/layout/Header.tsx` | Replace static username with UserMenu dropdown component |
| `src/context/AppContext.tsx` | Add `logout`, `resetSettings` actions; wire session transfer state |
| `src/App.tsx` | Add history view route, session transfer banner, email verification listener |

## New Files

| File | Purpose |
|------|---------|
| `src/components/layout/UserMenu.tsx` | Dropdown menu with balance, payment toggle, logout |
| `src/components/auth/SessionTransferBanner.tsx` | Persistent warning banner for session transfer |
| `src/components/auth/EmailVerificationModal.tsx` | Modal guiding user to verify email |
| `src/components/history/HistoryView.tsx` | Grid view of past makeovers |
