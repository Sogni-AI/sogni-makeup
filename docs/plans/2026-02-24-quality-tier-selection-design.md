# Quality Tier Selection Design

## Overview

Add a quality tier selection step to the onboarding flow, shown after gender selection and before photo capture. Three tiers map to existing models.

## Flow

1. User clicks "Start Your Makeover" → gender buttons animate in (existing)
2. User clicks gender → stored locally, gender buttons animate out, quality tier buttons animate in (same position, `AnimatePresence mode="wait"`)
3. User clicks a quality tier → model persisted via `updateSetting`, gender set in context, navigate to `capture` view

The quality picker is shown **every time** - never skipped. The user's previous choice is pre-highlighted so they can see their current default.

## Quality Tiers

| Label | Model ID | Steps | Notes |
|-------|----------|-------|-------|
| "Make it fast!" | `qwen_image_edit_2511_fp8_lightning` | 4 | Default for new users |
| "Good looks take time." | `qwen_image_edit_2511_fp8` | 25 | Standard quality |
| "Pro Tier Quality" | `flux2_dev_fp8` | 30 | Highest quality |

## UI

- Three stacked vertical buttons in the same `AnimatePresence` container that currently holds gender selection
- Matching aesthetic: `border-primary-400/20`, `bg-surface-900/60`, backdrop-blur
- Pre-highlighted button has brighter border/glow to indicate current selection
- Buttons animate in with stagger, same easing as gender icons

## State Changes

- **LandingHero.tsx**: New local state `selectedGenderLocal` to hold gender between steps. New `showQualitySelect` state (or extend `showGenderSelect` to a union/enum). New `handleSelectQuality` handler.
- **AppContext**: Read `settings.defaultModel` for highlight state. Use existing `updateSetting('defaultModel', ...)` for persistence - no new state needed.

## Files Modified

1. `src/components/landing/LandingHero.tsx` - Add quality tier step to the AnimatePresence flow
