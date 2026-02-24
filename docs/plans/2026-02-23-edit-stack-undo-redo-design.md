# Edit Stack with Undo/Redo and Stacked/Original Mode

**Date:** 2026-02-23
**Status:** Approved

## Problem

Today, every makeover transformation is independent — it always runs against the original uploaded photo. Users cannot:
- Apply changes on top of previous results (e.g., blonde hair + red lipstick)
- Undo a transformation to go back to a previous state
- Redo a transformation they undid
- Choose whether a new edit builds on the current result or starts fresh

## Solution

Introduce an **edit stack** — an in-memory ordered list of transformation steps. The user navigates this stack with undo/redo and chooses whether new edits build on the current result ("stacked" mode) or start from the original photo ("original" mode).

## Data Model

```typescript
interface EditStep {
  transformation: Transformation;
  resultImageUrl: string;       // CDN URL of the result
  resultImageBase64: string;    // Pre-fetched base64 for use as next input
  timestamp: number;
}
```

Edit stack state (React state, NOT persisted to localStorage):

- `steps: EditStep[]` — Completed edits, oldest first
- `currentIndex: number` — Which step is active (-1 = original photo)
- `mode: 'stacked' | 'original'` — What the next edit applies to (default: `'stacked'`)

## Key Behaviors

| Action | Result |
|--------|--------|
| First transformation | Creates step 0, `currentIndex` = 0 |
| Undo | Decrements `currentIndex`; displays that step's result (or original at -1) |
| Redo | Increments `currentIndex`; displays that step's result |
| New transformation after undo | Truncates steps after `currentIndex`, appends new step (standard editor branching) |
| Stacked mode + result exists | Next generation uses `steps[currentIndex].resultImageBase64` as input |
| Original mode | Next generation uses `originalImageBase64` as input |
| Stacked mode + no result | Graceful fallback to `originalImageBase64` |
| "New Photo" | Clears entire stack, resets to capture view |
| Generation fails/cancelled | No step added; state remains at previous step |
| Max stack depth (20) | Oldest steps removed from undo stack with subtle notification; still preserved in History |

## UI Changes

### Floating Action Bar (ResultDisplay, bottom of photo area)

The existing `[Compare] | [Save] | [Full View]` bar gains undo/redo controls on the left.

**Progressive disclosure:**
- No result yet: no floating bar (current behavior)
- 1 result: `[Undo] | [Compare] [Save] [Full View]` — redo hidden
- 2+ results: `[Undo] [Redo] | [Compare] [Save] [Full View]`

Undo is disabled (dimmed) when at original. Redo is disabled when at latest step.

When undone all the way to original: `OriginalPhoto` renders, but a minimal floating redo button remains so the user can navigate forward.

On mobile: icons only (no labels) to conserve space.

### Toolbar Strip (between photo area and transformation picker)

The existing `[New Photo] | [History] | CurrentTransformation` toolbar gains:

- **Mode toggle:** A segmented control `[Original | Stacked]` — appears only after first result
- **Step indicator:** `(3 of 5)` after the transformation name — appears when stack has > 1 step

```
[<- New Photo] | [History] | [Original . Stacked] | Blonde (3 of 5)
```

On mobile: abbreviated `Orig | Stack` or icon-based toggle.

## Generation Flow Changes

### Input Image Selection

In `generateMakeover`, replace the hardcoded `contextImages: [originalImageBase64]` with:

```
if mode === 'stacked' AND currentIndex >= 0:
  contextImages = [steps[currentIndex].resultImageBase64]
else:
  contextImages = [originalImageBase64]
```

### Post-Generation: Base64 Pre-fetch

After generation completes and `resultImageUrl` is available:

1. Fetch the result image URL
2. Convert to base64 via canvas (Image -> canvas -> toDataURL -> strip prefix)
3. Store in the new `EditStep.resultImageBase64`

This ensures the base64 is immediately ready for the next stacked generation. If CORS blocks direct fetch, proxy through the backend.

### Stack Management

After generation completes:

1. If `currentIndex < steps.length - 1`, truncate `steps` to `[0..currentIndex]` (discard redo history)
2. Append new `EditStep`
3. Set `currentIndex = steps.length - 1`
4. Continue adding to existing localStorage History as before (independent of stack)

## Scope Boundaries

**In scope:**
- Edit stack state management (new hook or context extension)
- Undo/redo UI in floating action bar
- Original/Stacked mode toggle in toolbar
- Step indicator in toolbar
- Generation flow change to use result image as input
- Base64 pre-fetch after generation
- Memory cap at 20 steps

**Out of scope:**
- Persisting the edit stack across sessions
- Keyboard shortcuts for undo/redo
- Branching/forking history (multiple parallel edit paths)
- Batch undo (jump to specific step via filmstrip)

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Result image URL expires | Pre-cached base64 is used for display and next generation; download may fail gracefully |
| View History page and return | Stack preserved; user returns to current position |
| Switch Results view -> Studio | Stack preserved; user continues editing |
| Demo mode | Each generation counts as one demo use regardless of stacked/original mode |
| Memory pressure (20 steps) | Oldest steps evicted from undo stack with toast notification |
| Undo to original, apply stacked | Graceful fallback to original (no result to stack on) |
