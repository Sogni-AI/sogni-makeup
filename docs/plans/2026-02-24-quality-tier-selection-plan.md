# Quality Tier Selection Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a quality tier selection step after gender selection in the onboarding flow, mapping three fun labels to existing AI models.

**Architecture:** Extend the existing `AnimatePresence mode="wait"` in `LandingHero.tsx` from 2 states (button → gender) to 3 states (button → gender → quality). Gender selection stores locally, quality selection persists the model via `updateSetting`, sets gender in context, and navigates to capture. User's previous model choice is pre-highlighted.

**Tech Stack:** React, Framer Motion, TypeScript, existing AppContext/settings infrastructure.

---

### Task 1: Add Quality Tier Step to LandingHero

**Files:**
- Modify: `src/components/landing/LandingHero.tsx`

**Step 1: Add imports and quality tier data**

At the top of `LandingHero.tsx`, add the model imports and quality tier constant:

```typescript
// Add to existing imports from '@/context/AppContext':
// Change line 61 from:
//   const { setCurrentView, setSelectedGender } = useApp();
// to:
//   const { setCurrentView, setSelectedGender, settings, updateSetting } = useApp();

import {
  QWEN_LIGHTNING_MODEL_ID,
  QWEN_STANDARD_MODEL_ID,
  FLUX2_DEV_MODEL_ID,
} from '@/constants/settings';

const QUALITY_TIERS = [
  { label: 'Make it fast!', modelId: QWEN_LIGHTNING_MODEL_ID },
  { label: 'Good looks take time.', modelId: QWEN_STANDARD_MODEL_ID },
  { label: 'Pro Tier Quality', modelId: FLUX2_DEV_MODEL_ID },
] as const;
```

**Step 2: Add state for the quality selection step**

Replace the single `showGenderSelect` boolean with a step enum and a local gender holder. In `LandingHero()` (around lines 61-63):

```typescript
// REPLACE:
//   const [showGenderSelect, setShowGenderSelect] = useState(false);

// WITH:
const [step, setStep] = useState<'idle' | 'gender' | 'quality'>('idle');
const [pendingGender, setPendingGender] = useState<Gender | null>(null);
```

**Step 3: Update handleSelectGender to transition to quality step**

Replace the existing `handleSelectGender` (lines 201-204):

```typescript
// REPLACE:
//   const handleSelectGender = (gender: Gender) => {
//     setSelectedGender(gender);
//     setCurrentView('capture');
//   };

// WITH:
const handleSelectGender = (gender: Gender) => {
  setPendingGender(gender);
  setStep('quality');
};

const handleSelectQuality = (modelId: string) => {
  if (pendingGender) setSelectedGender(pendingGender);
  updateSetting('defaultModel', modelId);
  setCurrentView('capture');
};
```

**Step 4: Update the AnimatePresence block**

Replace the AnimatePresence content (lines 319-382). Change `!showGenderSelect` to `step === 'idle'`, the gender block key to `step === 'gender'`, and add a third block for quality:

```tsx
<AnimatePresence mode="wait">
  {step === 'idle' ? (
    <motion.div
      key="start-button"
      initial={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
      className="flex flex-col items-center gap-4"
    >
      <Button
        variant="primary"
        size="lg"
        onClick={() => setStep('gender')}
        className="text-lg shadow-xl shadow-primary-400/10"
      >
        Start Your Makeover
      </Button>
      <p className="text-sm font-light tracking-wide text-white/20">
        No sign-up required &bull; Free to try
      </p>
    </motion.div>
  ) : step === 'gender' ? (
    <motion.div
      key="gender-select"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
      className="flex items-center gap-8 sm:gap-12"
    >
      {/* Female icon */}
      <motion.button
        aria-label="Female"
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
        <span className="absolute -bottom-6 text-[10px] font-light uppercase tracking-[0.15em] text-white/0 transition-all duration-300 group-hover:text-white/40">femme</span>
      </motion.button>

      {/* Divider */}
      <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

      {/* Male icon */}
      <motion.button
        aria-label="Male"
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
        <span className="absolute -bottom-6 text-[10px] font-light uppercase tracking-[0.15em] text-white/0 transition-all duration-300 group-hover:text-white/40">homme</span>
      </motion.button>
    </motion.div>
  ) : (
    <motion.div
      key="quality-select"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
      className="flex flex-col items-center gap-3"
    >
      {QUALITY_TIERS.map((tier, i) => {
        const isCurrentDefault = settings.defaultModel === tier.modelId;
        return (
          <motion.button
            key={tier.modelId}
            initial={{ y: 20, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: { delay: 0.1 + i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelectQuality(tier.modelId)}
            className={`relative w-64 rounded-full border px-6 py-3 text-sm font-light tracking-wide backdrop-blur-sm transition-all duration-300 cursor-pointer sm:w-72 ${
              isCurrentDefault
                ? 'border-primary-400/40 bg-primary-400/[0.08] text-white/80 shadow-lg shadow-primary-400/10'
                : 'border-primary-400/15 bg-surface-900/60 text-white/50 hover:border-primary-400/30 hover:bg-primary-400/[0.05] hover:text-white/70'
            }`}
          >
            {tier.label}
          </motion.button>
        );
      })}
    </motion.div>
  )}
</AnimatePresence>
```

**Step 5: Verify it builds**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run build`
Expected: Build succeeds with no TypeScript errors.

**Step 6: Verify lint passes**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run lint`
Expected: 0 warnings, 0 errors.

**Step 7: Commit**

```bash
git add src/components/landing/LandingHero.tsx
git commit -m "feat: add quality tier selection step after gender in onboarding flow"
```
