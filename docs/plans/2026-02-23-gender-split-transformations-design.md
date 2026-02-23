# Gender-Split Transformations Design

## Overview

Split makeover transformation categories into gender-specific options and expand the catalog with male-focused content (facial hair, grooming, male hairstyles, menswear) and additional female-specific options.

## Data Model

### Transformation type

Add `gender` field to `Transformation`:

```typescript
gender: 'male' | 'female' | 'neutral';
```

Items tagged `neutral` appear for both genders. Items tagged `male` or `female` only appear when that gender is selected.

### Category metadata

Add optional gender-specific display overrides to `CATEGORIES`:

```typescript
maleName?: string;   // e.g., 'Grooming' instead of 'Makeup'
maleIcon?: string;   // e.g., razor emoji instead of lipstick
```

### Subcategory metadata

Add optional gender field to `TransformationSubcategory`:

```typescript
gender?: 'male' | 'female';  // absent = shows for both
```

### Helper functions

Existing helpers gain an optional `gender` parameter:

- `getTransformationsByCategory(category, gender?)` — returns items matching gender + neutral
- `getTransformationsBySubcategory(category, subcategory, gender?)` — same
- `getSubcategoriesForGender(category, gender?)` — filters subcategories by gender

## Gender Tagging of Existing Items

| Category | Items | Assignment |
|----------|-------|------------|
| Hairstyles — Color (14) | All | `neutral` |
| Hairstyles — Style (18) | bob, pixie, ponytail, messy bun, bangs | `female` |
| Hairstyles — Style (18) | buzz cut, undercut | `male` |
| Hairstyles — Style (18) | long waves, curly, straight, braids, mohawk, afro, locs, box braids, mullet, shag, wolf cut | `neutral` |
| Hairstyles — Length (5) | All | `neutral` |
| Makeup — all (26) | All existing | `female` |
| Clothing — Formal | Tuxedo | `male` |
| Clothing — Formal | Evening Gown, Cocktail Dress | `female` |
| Clothing — Formal | Business Suit | `neutral` |
| Clothing — Casual (5) | All | `neutral` |
| Clothing — Cultural (4) | All | `neutral` |
| Clothing — Decades (7) | All | `neutral` |
| Facial Features (19) | All | `neutral` |
| Body | Curvier | `female` |
| Body | Slimmer, Athletic, Taller, Body Builder | `neutral` |
| Age & Fantasy (18) | All | `neutral` (no gender split) |

## New Male Transformations

### Hairstyles — Style (male)

Fade, Crew Cut, Slick Back, Man Bun, Pompadour, Quiff, Comb Over, Flat Top

### Hairstyles — Facial Hair (new subcategory, male only)

Full Beard, Stubble, Goatee, Mustache, Handlebar Mustache, Van Dyke, Mutton Chops, Soul Patch, Clean Shaven, 5 O'Clock Shadow, Lumberjack Beard, Chinstrap

### Grooming (male version of Makeup category)

**Skin subcategory**: Clear Skin, Bronzed, Matte Skin, Healthy Glow

**Brows subcategory**: Thick Brows, Groomed Brows, Bushy Brows

**Full Looks subcategory**: Well-Groomed, Rugged, Pretty Boy, Distinguished

### Clothing — Formal (male)

Three-Piece Suit, Military Dress Uniform

### Clothing — Casual (male)

Workwear, Biker

### Body (male)

Broad Shoulders, Lean/Ripped

## New Female Transformations

### Hairstyles — Style (female)

French Twist, Side Swept, Half Up Half Down, Space Buns, Curtain Bangs, Layered

### Clothing — Formal (female)

Ball Gown, Jumpsuit

### Clothing — Casual (female)

Cottagecore, Y2K Girly

### Body (female)

Hourglass, Petite

## Subcategory Changes

### Makeup/Grooming category subcategories by gender

| Female | Male |
|--------|------|
| Lips, Eyes, Face, Full Looks | Skin, Brows, Full Looks |

### Hairstyles new subcategory

| Subcategory | Gender |
|-------------|--------|
| Facial Hair | male only |

## Files Modified

1. `src/types/index.ts` — Add `gender` to Transformation type, update TransformationSubcategory
2. `src/constants/transformations.ts` — Add gender field to all items, add new items, update CATEGORIES/SUBCATEGORIES, update helpers
3. `src/components/studio/TransformationPicker.tsx` — Pass gender to helpers for filtering
4. `src/components/studio/CategoryNav.tsx` — Use gender-aware display names
5. `src/components/studio/MakeoverStudio.tsx` — Thread gender from app state to child components
