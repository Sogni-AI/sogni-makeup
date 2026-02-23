# Gender Selection on Landing Page

## Summary

Transform the "Start Your Makeover" button into a gender selection step. When clicked, the button morphs and splits into two large, high-art gender icons (Venus/Mars). Hovering over each icon crossfades the facing portraits to that gender's before/after images. Selecting a gender stores the choice and navigates to the capture screen.

## Interaction Flow

```
INITIAL (default landing state)
  -> Click "Start Your Makeover"

GENDER_SELECT (button morphs into two icons)
  -> Hover Female: portraits show before.png / after.png (default)
  -> Hover Male: portraits crossfade to before2.png / after2.png
  -> Click icon: store gender in AppContext, navigate to 'capture'
```

## Animation: Morph/Split (~800ms, CSS-only)

**Phase 1 (0-300ms):** Button text fades out (opacity 1->0), button scales down slightly (0.95), begins elongating horizontally.

**Phase 2 (300-600ms):** Button element is replaced by two icon containers. Each translates apart (left: -80px, right: +80px) while scaling up from 0->1.

**Phase 3 (600-800ms):** Icons settle with subtle overshoot (scale 1.05->1.0). Soft glow appears around each icon.

Implementation: CSS transitions on opacity, transform (scale + translateX). State toggle swaps between button and icons in the DOM. `transition-delay` choreographs the phases.

## Portrait Crossfade on Hover (~400ms)

All 4 images layered in the DOM at all times:
- `before.png` (female, left) — always rendered
- `after.png` (female, right) — always rendered
- `before2.png` (male, left) — opacity controlled by hover
- `after2.png` (male, right) — opacity controlled by hover

Default state: female portraits visible, male at opacity 0.
On male icon hover: male portraits transition to full opacity over 400ms ease.
On hover out: male portraits fade back to 0.

No layout shifts — images are absolutely positioned and stacked.

## Icon Design

- Large SVG Venus (female) and Mars (male) symbols
- Thin-stroke, elegant line art style — high-art aesthetic
- Circular glass-morphism container (~80-100px diameter on desktop)
- Responsive sizing for mobile
- Hover state: subtle scale-up (1.08) and brighter glow
- Active/selected state: brief pulse before navigation

## State Management

Add to AppContext:
- `selectedGender: 'female' | 'male' | null` (default: null)
- `setSelectedGender(gender: 'female' | 'male')` action

On icon click: `setSelectedGender(gender)` then `setCurrentView('capture')`.

## Files Changed

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `Gender` type |
| `src/context/AppContext.tsx` | Add `selectedGender` state + setter |
| `src/components/landing/LandingHero.tsx` | Morph animation, gender icons, portrait layering |
| `public/images/before2.png` | Male before portrait (provided by user) |
| `public/images/after2.png` | Male after portrait (provided by user) |

No new components — all changes within existing LandingHero.

## Image Files

- Female: `before.png` (existing), `after.png` (existing)
- Male: `before2.png` (user-provided), `after2.png` (user-provided)

## Approach

CSS-only animations (no Framer Motion or GSAP). Matches existing project patterns — Tailwind + inline styles, CSS transitions. Zero new dependencies.
