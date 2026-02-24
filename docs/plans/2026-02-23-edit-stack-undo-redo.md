# Edit Stack with Undo/Redo Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an edit stack so users can stack transformations, undo/redo between states, and toggle whether new edits apply to the current result or the original photo.

**Architecture:** A `useEditStack` hook manages an in-memory array of edit steps with a cursor (`currentIndex`). The hook uses `useReducer` for atomic state transitions. AppContext integrates the hook and feeds the correct input image (result base64 or original base64) into `generateMakeover`. UI changes are limited to `ResultDisplay` (undo/redo buttons) and `MakeoverStudio` (mode toggle + step indicator).

**Tech Stack:** React 18, TypeScript, Framer Motion, Tailwind CSS, existing AppContext pattern

**Design doc:** `docs/plans/2026-02-23-edit-stack-undo-redo-design.md`

---

## Task 1: Add EditStep and EditMode Types

**Files:**
- Modify: `src/types/index.ts:56` (after GenerationResult interface)

**Step 1: Add types after the GenerationResult interface (line 56)**

Add these types between `GenerationResult` and `GenerationProgress`:

```typescript
// Edit stack
export interface EditStep {
  transformation: Transformation;
  resultImageUrl: string;
  resultImageBase64: string;
  timestamp: number;
}

export type EditMode = 'stacked' | 'original';
```

**Step 2: Run lint**

Run: `cd /Users/markledford/Documents/git/sogni-makeover && npm run lint`
Expected: 0 warnings, 0 errors

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add EditStep and EditMode types for edit stack"
```

---

## Task 2: Create fetchImageAsBase64 Utility

**Files:**
- Create: `src/utils/image.ts`

This utility fetches an image URL and returns its base64 representation. The same approach used by `ResultDisplay.handleDownload` (fetch -> blob), extended to convert to base64 via FileReader. CORS is not a concern since the app already fetches result URLs directly.

**Step 1: Create the utility**

```typescript
/**
 * Fetch an image from a URL and convert it to a raw base64 string
 * (no data URL prefix). Used to cache result images for stacked editing.
 */
export async function fetchImageAsBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const blob = await response.blob();

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        // Strip the "data:image/...;base64," prefix to get raw base64
        const base64 = result.includes(',') ? result.split(',')[1] : result;
        resolve(base64);
      } else {
        reject(new Error('Failed to convert image to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image blob'));
    reader.readAsDataURL(blob);
  });
}
```

**Step 2: Run lint**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 3: Commit**

```bash
git add src/utils/image.ts
git commit -m "feat: add fetchImageAsBase64 utility for edit stack"
```

---

## Task 3: Create useEditStack Hook

**Files:**
- Create: `src/hooks/useEditStack.ts`

This is the core state machine. Uses `useReducer` for atomic state transitions so undo/redo/push operations are always consistent. No async logic here — pure state management.

**Step 1: Create the hook**

```typescript
import { useReducer, useCallback } from 'react';
import type { EditStep, EditMode, Transformation } from '@/types';

const MAX_STACK_DEPTH = 20;

// ---------------------------------------------------------------------------
// State & Actions
// ---------------------------------------------------------------------------

interface EditStackState {
  steps: EditStep[];
  currentIndex: number; // -1 = viewing the original photo
  mode: EditMode;
}

type EditStackAction =
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'push'; step: EditStep }
  | { type: 'updateBase64'; index: number; base64: string }
  | { type: 'setMode'; mode: EditMode }
  | { type: 'reset' };

const initialState: EditStackState = {
  steps: [],
  currentIndex: -1,
  mode: 'stacked',
};

function editStackReducer(state: EditStackState, action: EditStackAction): EditStackState {
  switch (action.type) {
    case 'undo':
      if (state.currentIndex < 0) return state;
      return { ...state, currentIndex: state.currentIndex - 1 };

    case 'redo':
      if (state.currentIndex >= state.steps.length - 1) return state;
      return { ...state, currentIndex: state.currentIndex + 1 };

    case 'push': {
      // Truncate any redo steps beyond current position
      const truncated = state.steps.slice(0, state.currentIndex + 1);
      let newSteps = [...truncated, action.step];
      let newIndex = newSteps.length - 1;

      // Cap at MAX_STACK_DEPTH — evict oldest
      if (newSteps.length > MAX_STACK_DEPTH) {
        newSteps = newSteps.slice(newSteps.length - MAX_STACK_DEPTH);
        newIndex = newSteps.length - 1;
      }

      return { ...state, steps: newSteps, currentIndex: newIndex };
    }

    case 'updateBase64': {
      if (action.index < 0 || action.index >= state.steps.length) return state;
      const updated = [...state.steps];
      updated[action.index] = { ...updated[action.index], resultImageBase64: action.base64 };
      return { ...state, steps: updated };
    }

    case 'setMode':
      return { ...state, mode: action.mode };

    case 'reset':
      return initialState;

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export interface UseEditStackReturn {
  // State
  steps: EditStep[];
  currentIndex: number;
  mode: EditMode;
  currentStep: EditStep | null;
  activeImageUrl: string | null;
  canUndo: boolean;
  canRedo: boolean;
  stepCount: number;
  hasSteps: boolean;

  // Actions
  undo: () => void;
  redo: () => void;
  pushStep: (step: EditStep) => void;
  updateStepBase64: (index: number, base64: string) => void;
  setMode: (mode: EditMode) => void;
  reset: () => void;

  // Derived helper — returns the base64 to send as contextImages[0]
  getInputBase64: (originalBase64: string) => string | null;
}

export function useEditStack(): UseEditStackReturn {
  const [state, dispatch] = useReducer(editStackReducer, initialState);

  const { steps, currentIndex, mode } = state;
  const currentStep = currentIndex >= 0 ? steps[currentIndex] ?? null : null;
  const activeImageUrl = currentStep?.resultImageUrl ?? null;
  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < steps.length - 1;

  const undo = useCallback(() => dispatch({ type: 'undo' }), []);
  const redo = useCallback(() => dispatch({ type: 'redo' }), []);
  const pushStep = useCallback((step: EditStep) => dispatch({ type: 'push', step }), []);
  const updateStepBase64 = useCallback(
    (index: number, base64: string) => dispatch({ type: 'updateBase64', index, base64 }),
    [],
  );
  const setMode = useCallback((mode: EditMode) => dispatch({ type: 'setMode', mode }), []);
  const reset = useCallback(() => dispatch({ type: 'reset' }), []);

  const getInputBase64 = useCallback(
    (originalBase64: string): string | null => {
      if (mode === 'original' || !currentStep) {
        return originalBase64;
      }
      // Return the current step's cached base64 (may be empty if still fetching)
      return currentStep.resultImageBase64 || null;
    },
    [mode, currentStep],
  );

  return {
    steps,
    currentIndex,
    mode,
    currentStep,
    activeImageUrl,
    canUndo,
    canRedo,
    stepCount: steps.length,
    hasSteps: steps.length > 0,
    undo,
    redo,
    pushStep,
    updateStepBase64,
    setMode,
    reset,
    getInputBase64,
  };
}
```

**Step 2: Run lint**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 3: Commit**

```bash
git add src/hooks/useEditStack.ts
git commit -m "feat: add useEditStack hook with reducer-based state management"
```

---

## Task 4: Integrate Edit Stack into AppContext

**Files:**
- Modify: `src/context/AppContext.tsx`

This is the most complex task. Changes:
1. Import and call `useEditStack()`
2. Add edit stack values/actions to context interface and provider value
3. Modify `generateMakeover` to select input image from edit stack
4. After generation completes, push a step to the edit stack (with async base64 fetch)
5. Clear edit stack in `resetPhoto`

**Step 1: Add imports (top of file)**

Add to the existing imports at `src/context/AppContext.tsx:1-13`:

```typescript
import type { EditStep, EditMode } from '@/types';
import { useEditStack } from '@/hooks/useEditStack';
import type { UseEditStackReturn } from '@/hooks/useEditStack';
import { fetchImageAsBase64 } from '@/utils/image';
```

**Step 2: Extend AppContextValue interface (lines 35-92)**

Add these fields to the `AppContextValue` interface, after the `currentResult` line (around line 63):

```typescript
  // Edit stack
  editStack: UseEditStackReturn;
```

**Step 3: Call useEditStack in AppProvider (around line 157, after useAutoEnhance)**

```typescript
  // -- Edit stack --
  const editStack = useEditStack();
```

**Step 4: Add a ref to hold the current edit stack input base64**

Right after the `editStack` declaration, add a ref so `generateMakeover` can access the latest input without adding functions/objects to its dependency array (per the project's useEffect rules):

```typescript
  // Ref to hold current input image base64 for generation
  // Avoids adding editStack to generateMakeover's dependency array
  const editStackInputRef = useRef<{
    mode: EditMode;
    currentStepBase64: string | null;
    currentStepUrl: string | null;
  }>({ mode: 'stacked', currentStepBase64: null, currentStepUrl: null });

  // Keep ref in sync (runs every render, no effect needed)
  editStackInputRef.current = {
    mode: editStack.mode,
    currentStepBase64: editStack.currentStep?.resultImageBase64 ?? null,
    currentStepUrl: editStack.currentStep?.resultImageUrl ?? null,
  };
```

**Step 5: Modify generateMakeover — input image selection**

In the `generateMakeover` callback, replace the early base64 check and the `contextImages` construction. Find this block (around lines 410-426):

```typescript
      if (!originalImageBase64) {
        setGenerationProgress({
          projectId: '',
          status: 'error',
          progress: 0,
          message: 'No image selected. Please capture or upload a photo first.',
        });
        return;
      }

      // 2. Build params
      const negativePrompt = transformation.negativePrompt ?? GENERATION_DEFAULTS.negativePrompt;
      const params: GenerationParams = {
        ...
        contextImages: [originalImageBase64],
```

Replace with:

```typescript
      if (!originalImageBase64) {
        setGenerationProgress({
          projectId: '',
          status: 'error',
          progress: 0,
          message: 'No image selected. Please capture or upload a photo first.',
        });
        return;
      }

      // Determine input image: stacked mode uses previous result, original mode uses original
      let inputBase64 = originalImageBase64;
      const { mode: stackMode, currentStepBase64, currentStepUrl } = editStackInputRef.current;
      if (stackMode === 'stacked' && currentStepBase64) {
        inputBase64 = currentStepBase64;
      } else if (stackMode === 'stacked' && currentStepUrl) {
        // Base64 not yet cached — fetch on demand
        try {
          inputBase64 = await fetchImageAsBase64(currentStepUrl);
        } catch {
          // Fall back to original if fetch fails
          console.warn('Failed to fetch stacked image, falling back to original');
        }
      }

      // 2. Build params
      const negativePrompt = transformation.negativePrompt ?? GENERATION_DEFAULTS.negativePrompt;
      const params: GenerationParams = {
        ...
        contextImages: [inputBase64],
```

The rest of the params object stays the same — just change `contextImages: [originalImageBase64]` to `contextImages: [inputBase64]`.

**Step 6: Modify generateMakeover — push edit step after generation completes**

This needs to happen in BOTH paths (Path A: frontend SDK, Path B: backend SSE).

**Path A (authenticated, around line 590, after `setCurrentResult(result)`):**

Add after `setCurrentResult(result)` and before the history item creation:

```typescript
          // Push to edit stack and start base64 pre-fetch
          const stepIndex = editStack.steps.length; // will be the index after push
          editStack.pushStep({
            transformation,
            resultImageUrl: resultImageUrl,
            resultImageBase64: '', // populated async below
            timestamp: Date.now(),
          });

          // Pre-fetch result as base64 for future stacked generations
          fetchImageAsBase64(resultImageUrl).then(base64 => {
            editStack.updateStepBase64(stepIndex, base64);
          }).catch(() => {
            // Non-critical — will be fetched on-demand if needed
          });
```

Note: `editStack.pushStep` and `editStack.updateStepBase64` are stable callbacks (from `useCallback` with `[]` deps), so accessing them in `generateMakeover`'s closure is safe per the project's rules — they don't need to be in the dependency array.

**Path B (demo/SSE, around line 800, inside the `'complete'` event handler, after `setCurrentResult(result)`):**

Add the same block (copy-paste) after `setCurrentResult(result)`:

```typescript
                // Push to edit stack and start base64 pre-fetch
                const stepIndex = editStack.steps.length;
                editStack.pushStep({
                  transformation,
                  resultImageUrl: result.imageUrl,
                  resultImageBase64: '',
                  timestamp: Date.now(),
                });

                fetchImageAsBase64(result.imageUrl).then(base64 => {
                  editStack.updateStepBase64(stepIndex, base64);
                }).catch(() => {
                  // Non-critical
                });
```

**Step 7: Modify resetPhoto to clear edit stack**

In the `resetPhoto` callback (around line 282), add `editStack.reset()`:

```typescript
  const resetPhoto = useCallback(() => {
    setOriginalImageRaw(null);
    setOriginalImageUrl(null);
    setOriginalImageBase64(null);
    setCurrentTransformation(null);
    setGenerationProgress(null);
    setCurrentResult(null);
    editStack.reset();
    setCurrentView('capture');
  }, []);
```

**Step 8: Add editStack to the context provider value**

In the return JSX (around line 910), add to the `value` object:

```typescript
        editStack,
```

**Step 9: Run lint and validate useEffect patterns**

Run: `npm run lint && npm run validate:useeffect`
Expected: 0 warnings, 0 errors

**Step 10: Commit**

```bash
git add src/context/AppContext.tsx
git commit -m "feat: integrate edit stack into AppContext with stacked generation support"
```

---

## Task 5: Update ResultDisplay with Undo/Redo Buttons

**Files:**
- Modify: `src/components/studio/ResultDisplay.tsx`

Add undo/redo buttons to the left side of the existing floating action bar. Progressive disclosure: undo always shown when a result exists (it's always relevant since there's at least 1 step). Redo only shown when `canRedo` is true.

**Step 1: Replace the full ResultDisplay component**

The key changes:
- Pull `editStack` from context
- Add undo button (always visible), redo button (when `canRedo`)
- Add a divider between undo/redo group and existing actions

Replace the floating action bar section (lines 65-96) with:

```tsx
      {/* Floating action bar */}
      <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-primary-400/10 bg-surface-900/80 px-2 py-1.5 shadow-xl backdrop-blur-md">
        {/* Undo/Redo group */}
        <button
          onClick={editStack.undo}
          disabled={!editStack.canUndo}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-primary-400/[0.06] hover:text-white disabled:pointer-events-none disabled:text-white/20"
          title="Undo"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
          </svg>
          <span className="hidden sm:inline">Undo</span>
        </button>
        {editStack.canRedo && (
          <button
            onClick={editStack.redo}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-primary-400/[0.06] hover:text-white"
            title="Redo"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
            </svg>
            <span className="hidden sm:inline">Redo</span>
          </button>
        )}
        <div className="h-4 w-px bg-primary-400/10" />

        {/* Existing actions */}
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-primary-400/[0.06] hover:text-white"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
          </svg>
          {showComparison ? 'Result' : 'Compare'}
        </button>
        <div className="h-4 w-px bg-primary-400/10" />
        <button
          onClick={handleDownload}
          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-primary-400/[0.06] hover:text-white"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Save
        </button>
        <div className="h-4 w-px bg-primary-400/10" />
        <button
          onClick={() => setCurrentView('results')}
          className="flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium text-white/70 transition-colors hover:bg-primary-400/[0.06] hover:text-white"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
          Full View
        </button>
      </div>
```

Also update the destructured context at line 11:

```typescript
  const { originalImageUrl, setCurrentView, editStack } = useApp();
```

**Step 2: Run lint**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 3: Commit**

```bash
git add src/components/studio/ResultDisplay.tsx
git commit -m "feat: add undo/redo buttons to ResultDisplay floating action bar"
```

---

## Task 6: Update MakeoverStudio with Mode Toggle, Step Indicator, and Undo-to-Original Support

**Files:**
- Modify: `src/components/studio/MakeoverStudio.tsx`

Three changes:
1. **Mode toggle** in the toolbar strip — segmented control `Original | Stacked`
2. **Step indicator** — `(3 of 5)` after transformation name
3. **Undo-to-original state** — when the user has undone to the original, show the original photo but with a floating redo button overlay

**Step 1: Add editStack to the destructured context (line 17-35)**

Add `editStack` to the destructured values from `useApp()`:

```typescript
    editStack,
```

**Step 2: Update the photo area to use edit stack's active image**

Replace the photo area logic (lines 97-102). Currently it shows `ResultDisplay` when there's a `currentResult`. We need to also account for the edit stack's `activeImageUrl` (which changes when the user undoes/redoes):

```tsx
          <div className="studio-photo-area">
            {(() => {
              // Determine which image to show based on edit stack position
              const displayUrl = editStack.activeImageUrl;
              const showResult = displayUrl && !isGenerating;

              if (showResult) {
                return <ResultDisplay resultUrl={displayUrl} />;
              }

              return (
                <>
                  <OriginalPhoto imageUrl={originalImageUrl} />
                  {/* Floating redo button when undone to original but redo is available */}
                  {editStack.canRedo && !isGenerating && (
                    <div className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2">
                      <button
                        onClick={editStack.redo}
                        className="flex items-center gap-1.5 rounded-full border border-primary-400/10 bg-surface-900/80 px-3 py-1.5 text-xs font-medium text-white/70 shadow-xl backdrop-blur-md transition-colors hover:bg-primary-400/[0.06] hover:text-white"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l6-6m0 0l-6-6m6 6H9a6 6 0 000 12h3" />
                        </svg>
                        Redo
                      </button>
                    </div>
                  )}
                </>
              );
            })()}
```

**Step 3: Add mode toggle and step indicator to the toolbar**

In the toolbar `<div>` (lines 130-162), add the mode toggle and step indicator. Insert after the History button block and before the currentTransformation display:

```tsx
              {/* Mode toggle — only shown after first result */}
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
```

And update the currentTransformation display to include the step indicator:

```tsx
              {currentTransformation && (
                <>
                  <span className="text-[10px] text-white/10">|</span>
                  <span className="text-[11px] text-primary-300/70">
                    {currentTransformation.icon} {currentTransformation.name}
                    {editStack.stepCount > 1 && (
                      <span className="ml-1 text-white/25">
                        ({editStack.currentIndex + 1} of {editStack.stepCount})
                      </span>
                    )}
                  </span>
                </>
              )}
```

**Step 4: Update the currentTransformation display for undo state**

When the user undoes, `currentTransformation` in AppContext still points to the last applied transformation. We should show the active step's transformation name instead. Update the transformation name display to use the edit stack's current step:

```tsx
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
```

**Step 5: Run lint and validate useEffect patterns**

Run: `npm run lint && npm run validate:useeffect`
Expected: 0 warnings, 0 errors

**Step 6: Commit**

```bash
git add src/components/studio/MakeoverStudio.tsx
git commit -m "feat: add mode toggle, step indicator, and undo-to-original state to studio"
```

---

## Task 7: Lint, Build, and Manual Verification

**Files:** None (validation only)

**Step 1: Run full lint**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 2: Validate useEffect patterns**

Run: `npm run validate:useeffect`
Expected: All effects pass validation

**Step 3: Run production build**

Run: `npm run build`
Expected: Build completes with no TypeScript errors

**Step 4: Manual smoke test checklist**

Start dev servers (`cd server && npm run dev` in terminal 1, `npm run dev` in terminal 2), then verify at `https://makeover-local.sogni.ai`:

1. Upload a photo, apply a transformation (e.g., Blonde Hair)
   - Result displays with floating bar showing [Undo] | [Compare] [Save] [Full View]
   - Toolbar shows mode toggle `[Original | Stacked]` with "Stacked" active
2. Apply a second transformation (e.g., Red Lipstick)
   - Result should show BOTH blonde hair + red lipstick (stacked mode)
   - Toolbar shows step indicator: `(2 of 2)`
   - Redo button NOT visible
3. Click Undo
   - Photo reverts to first result (blonde hair only)
   - Toolbar shows `(1 of 2)`
   - Redo button appears in floating bar
4. Click Undo again
   - Original photo shown
   - Floating redo button appears over original photo
   - Toolbar step indicator shows `(0 of 2)`
5. Click Redo
   - Returns to blonde hair result
6. Toggle to "Original" mode, apply a new transformation
   - Result should show transformation applied to ORIGINAL photo, not stacked
7. Toggle back to "Stacked" mode
8. Click "New Photo"
   - Entire edit stack clears, returns to capture view

**Step 5: Commit any fixes from smoke testing**

```bash
git add -A
git commit -m "fix: address issues found during edit stack smoke testing"
```

---

## Summary of Files Changed

| File | Action | Purpose |
|------|--------|---------|
| `src/types/index.ts` | Modify | Add `EditStep`, `EditMode` types |
| `src/utils/image.ts` | Create | `fetchImageAsBase64` utility |
| `src/hooks/useEditStack.ts` | Create | Core edit stack reducer + hook |
| `src/context/AppContext.tsx` | Modify | Integrate edit stack, modify `generateMakeover` input selection |
| `src/components/studio/ResultDisplay.tsx` | Modify | Add undo/redo to floating action bar |
| `src/components/studio/MakeoverStudio.tsx` | Modify | Mode toggle, step indicator, undo-to-original redo button |

## Dependency Order

```
Task 1 (types) ──┐
Task 2 (utility) ─┤
                   ├── Task 3 (hook) ── Task 4 (context) ──┬── Task 5 (ResultDisplay)
                   │                                         ├── Task 6 (MakeoverStudio)
                   │                                         └── Task 7 (lint/build/verify)
```

Tasks 1 and 2 can be done in parallel. Task 3 depends on both. Task 4 depends on Task 3. Tasks 5 and 6 depend on Task 4 and can be done in parallel. Task 7 is last.
