# Gender Selection Landing Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the "Start Your Makeover" button into a gender selection step with morph/split animation and portrait crossfading.

**Architecture:** Add `selectedGender` state to AppContext. In LandingHero, clicking "Start Your Makeover" toggles local `showGenderSelect` state which triggers a framer-motion `AnimatePresence` swap from button to two gender icon containers. Portrait images are layered with male variants crossfading on hover. Gender selection stores state and navigates to capture.

**Tech Stack:** React 18, TypeScript, framer-motion (already in project), Tailwind CSS

**Note:** The design doc said "CSS-only" but the codebase already uses framer-motion extensively in LandingHero and Button. Using framer-motion is consistent with existing patterns and adds zero new dependencies.

---

### Task 1: Add Gender type to types

**Files:**
- Modify: `src/types/index.ts:86-87`

**Step 1: Add Gender type**

Add above the `AppView` type at line 86:

```typescript
export type Gender = 'female' | 'male';
```

**Step 2: Verify lint passes**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run lint`
Expected: 0 warnings, 0 errors

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add Gender type for landing page gender selection"
```

---

### Task 2: Add selectedGender state to AppContext

**Files:**
- Modify: `src/context/AppContext.tsx:34-87` (interface), `src/context/AppContext.tsx:110-112` (state), `src/context/AppContext.tsx:898-932` (provider value)

**Step 1: Add to AppContextValue interface**

In `src/context/AppContext.tsx`, inside `AppContextValue` interface, after the `setCurrentView` line (line 37), add:

```typescript
  // Gender
  selectedGender: import('@/types').Gender | null;
  setSelectedGender: (gender: import('@/types').Gender) => void;
```

**Step 2: Add state in AppProvider**

After `const [currentView, setCurrentView] = useState<AppView>('landing');` (line 112), add:

```typescript
  // -- Gender --
  const [selectedGender, setSelectedGenderRaw] = useState<import('@/types').Gender | null>(null);
  const setSelectedGender = useCallback((gender: import('@/types').Gender) => {
    setSelectedGenderRaw(gender);
  }, []);
```

**Step 3: Add to provider value**

In the `<AppContext.Provider value={{...}}>` block, after `setCurrentView,` add:

```typescript
        selectedGender,
        setSelectedGender,
```

**Step 4: Verify lint passes**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run lint`
Expected: 0 warnings, 0 errors

**Step 5: Commit**

```bash
git add src/context/AppContext.tsx
git commit -m "feat: add selectedGender state to AppContext"
```

---

### Task 3: Create SVG gender icons

**Files:**
- Create: `src/components/landing/GenderIcons.tsx`

Create inline SVG components for Venus (female) and Mars (male) symbols. Thin-stroke, elegant line art style. These are pure presentational components — no logic.

**Step 1: Create the icon components**

```tsx
interface GenderIconProps {
  className?: string;
}

export function VenusIcon({ className = '' }: GenderIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circle */}
      <circle cx="50" cy="38" r="24" stroke="currentColor" strokeWidth="2.5" />
      {/* Vertical line */}
      <line x1="50" y1="62" x2="50" y2="88" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Horizontal cross */}
      <line x1="38" y1="76" x2="62" y2="76" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function MarsIcon({ className = '' }: GenderIconProps) {
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Circle */}
      <circle cx="40" cy="52" r="24" stroke="currentColor" strokeWidth="2.5" />
      {/* Diagonal arrow line */}
      <line x1="57" y1="35" x2="76" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arrow head horizontal */}
      <line x1="76" y1="16" x2="62" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arrow head vertical */}
      <line x1="76" y1="16" x2="76" y2="30" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
```

**Step 2: Verify lint passes**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run lint`
Expected: 0 warnings, 0 errors

**Step 3: Commit**

```bash
git add src/components/landing/GenderIcons.tsx
git commit -m "feat: add Venus and Mars SVG icon components"
```

---

### Task 4: Add portrait layering with male images to LandingHero

**Files:**
- Modify: `src/components/landing/LandingHero.tsx:33-93`

This task adds the male portrait images layered on top of female portraits, with opacity controlled by a `hoveredGender` local state. The crossfade logic comes in Task 5 when the gender icons are wired up.

**Step 1: Add local state for hover**

At the top of the `LandingHero` function (after line 34), add:

```typescript
  const [showGenderSelect, setShowGenderSelect] = useState(false);
  const [hoveredGender, setHoveredGender] = useState<'female' | 'male' | null>(null);
```

Add `useState` to the React import (or verify it's available — framer-motion re-exports are used, may need explicit import).

**Step 2: Add male portraits layered over female portraits**

Inside each existing portrait `motion.div` container, add a second `<img>` for the male version positioned absolutely on top, with opacity driven by `hoveredGender`:

For the LEFT portrait container (lines 49-70), inside the `motion.div` after the existing `<img>`, add:

```tsx
        <img
          src="/images/before2.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-right transition-opacity duration-500 ease-in-out"
          style={{
            filter: 'sepia(0.15) saturate(0.85) brightness(0.9)',
            opacity: hoveredGender === 'male' ? 0.7 : 0,
          }}
        />
```

The container `motion.div` needs `relative` positioning for the absolute child — but it already has `absolute` positioning itself, so the child img needs `absolute inset-0` which will work relative to the parent.

Wait — the parent is `position: absolute` already. The existing `<img>` is `h-full w-full object-cover`, not absolutely positioned. We need to make the container a positioning context. Add `relative` to the parent className if not present (it's not — it's `pointer-events-none absolute left-0 top-0...`). Since `absolute` already establishes a containing block, the child `absolute inset-0` will position relative to it. This works.

For the RIGHT portrait container (lines 72-93), same pattern:

```tsx
        <img
          src="/images/after2.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-left transition-opacity duration-500 ease-in-out"
          style={{
            filter: 'sepia(0.08) saturate(1.0) brightness(0.9)',
            opacity: hoveredGender === 'male' ? 0.75 : 0,
          }}
        />
```

**Step 3: Verify lint passes**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run lint`
Expected: 0 warnings, 0 errors

**Step 4: Verify useEffect validation passes**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run validate:useeffect`
Expected: Pass

**Step 5: Commit**

```bash
git add src/components/landing/LandingHero.tsx
git commit -m "feat: layer male portrait images with crossfade support"
```

---

### Task 5: Implement button morph/split into gender icons

**Files:**
- Modify: `src/components/landing/LandingHero.tsx:136-148`

Replace the static Button + subtitle with an `AnimatePresence` block that switches between the button and the gender selection icons based on `showGenderSelect` state.

**Step 1: Import dependencies**

At the top of LandingHero.tsx, add to imports:

```typescript
import { AnimatePresence } from 'framer-motion';
import { VenusIcon, MarsIcon } from './GenderIcons';
```

Also import `useApp` should now destructure `setSelectedGender` and `setCurrentView`:

```typescript
const { setCurrentView, setSelectedGender } = useApp();
```

**Step 2: Add gender selection handler**

Inside the component, add:

```typescript
  const handleSelectGender = (gender: 'female' | 'male') => {
    setSelectedGender(gender);
    setCurrentView('capture');
  };
```

**Step 3: Replace the button section**

Replace lines 136-148 (the `motion.div` containing the Button and subtitle) with:

```tsx
          <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center gap-4">
            <AnimatePresence mode="wait">
              {!showGenderSelect ? (
                <motion.div
                  key="start-button"
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                  className="flex flex-col items-center gap-4"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setShowGenderSelect(true)}
                    className="text-lg shadow-xl shadow-primary-400/10"
                  >
                    Start Your Makeover
                  </Button>
                  <p className="text-sm font-light tracking-wide text-white/20">
                    No sign-up required &bull; Free to try
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="gender-select"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                  className="flex items-center gap-8 sm:gap-12"
                >
                  {/* Female icon */}
                  <motion.button
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1, transition: { delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredGender('female')}
                    onHoverEnd={() => setHoveredGender(null)}
                    onClick={() => handleSelectGender('female')}
                    className="group relative flex h-20 w-20 items-center justify-center rounded-full border border-primary-400/20 bg-surface-900/60 backdrop-blur-sm transition-all duration-300 hover:border-primary-400/40 hover:bg-primary-400/[0.08] hover:shadow-lg hover:shadow-primary-400/10 sm:h-24 sm:w-24 cursor-pointer"
                  >
                    <VenusIcon className="h-10 w-10 text-white/50 transition-colors duration-300 group-hover:text-primary-300 sm:h-12 sm:w-12" />
                  </motion.button>

                  {/* Divider */}
                  <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                  {/* Male icon */}
                  <motion.button
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1, transition: { delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredGender('male')}
                    onHoverEnd={() => setHoveredGender(null)}
                    onClick={() => handleSelectGender('male')}
                    className="group relative flex h-20 w-20 items-center justify-center rounded-full border border-primary-400/20 bg-surface-900/60 backdrop-blur-sm transition-all duration-300 hover:border-primary-400/40 hover:bg-primary-400/[0.08] hover:shadow-lg hover:shadow-primary-400/10 sm:h-24 sm:w-24 cursor-pointer"
                  >
                    <MarsIcon className="h-10 w-10 text-white/50 transition-colors duration-300 group-hover:text-primary-300 sm:h-12 sm:w-12" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
```

**Step 4: Verify lint passes**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run lint`
Expected: 0 warnings, 0 errors

**Step 5: Verify useEffect validation passes**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run validate:useeffect`
Expected: Pass

**Step 6: Commit**

```bash
git add src/components/landing/LandingHero.tsx
git commit -m "feat: morph Start button into gender selection icons with crossfade portraits"
```

---

### Task 6: Visual verification and polish

**Files:**
- Possibly modify: `src/components/landing/LandingHero.tsx`

**Step 1: Start dev server and test**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run dev`

Test in browser at `https://makeover-local.sogni.ai`:
1. Page loads with "Start Your Makeover" button visible
2. Click button — it morphs/fades and two gender icons appear
3. Hover female icon — female portraits remain (default)
4. Hover male icon — portraits crossfade to male versions
5. Click either icon — navigates to capture screen
6. Verify gender is stored (check React DevTools for AppContext `selectedGender`)

**Step 2: Check mobile responsiveness**

- Icons should be 80px on mobile, 96px on tablet+
- Portrait crossfade should work on touch (tap to select)
- Animation should not cause layout jumps

**Step 3: Final lint and validation**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run lint && npm run validate:useeffect`
Expected: All pass

**Step 4: Polish commit if any tweaks needed**

```bash
git add -A
git commit -m "fix: polish gender selection animation and responsiveness"
```
