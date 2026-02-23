# Gender-Split Transformations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Split makeover transformation categories into gender-specific options and expand the catalog with male-focused and female-focused content.

**Architecture:** Add a `gender` field to the `Transformation` type and `TransformationSubcategory` type. Tag every existing item. Add ~45 new male-specific and ~10 new female-specific transformations. Update helper functions with optional gender filtering. Thread `selectedGender` from AppContext into studio components.

**Tech Stack:** TypeScript, React 18

---

### Task 1: Update TypeScript types

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add gender to Transformation and TransformationSubcategory types**

In `src/types/index.ts`, add `gender` field to `Transformation` interface and `TransformationSubcategory` interface:

```typescript
// Add after line 14 (end of TransformationSubcategory):
export interface TransformationSubcategory {
  id: string;
  name: string;
  icon: string;
  gender?: 'male' | 'female'; // absent = shows for both genders
}

// Add to Transformation interface after `intensity`:
export interface Transformation {
  id: string;
  name: string;
  category: TransformationCategory;
  subcategory: string;
  prompt: string;
  icon: string;
  thumbnail?: string;
  intensity?: number;
  negativePrompt?: string;
  gender?: 'male' | 'female'; // absent = neutral, shows for both
}
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add gender field to Transformation and TransformationSubcategory types"
```

---

### Task 2: Update CATEGORIES metadata with gender-aware display names

**Files:**
- Modify: `src/constants/transformations.ts`

**Step 1: Update CATEGORIES type and data**

Change the CATEGORIES record to include optional `maleName` and `maleIcon` fields. Only the `makeup` category needs these:

```typescript
export const CATEGORIES: Record<TransformationCategory, {
  name: string;
  maleName?: string;
  icon: string;
  maleIcon?: string;
  description: string;
}> = {
  hairstyles: {
    name: 'Hairstyles',
    icon: '✂️',
    description: 'Change hair color, style, and length',
  },
  makeup: {
    name: 'Makeup',
    maleName: 'Grooming',
    icon: '💄',
    maleIcon: '🪒',
    description: 'Apply lipstick, eye makeup, and full looks',
  },
  clothing: {
    name: 'Clothing & Style',
    icon: '👔',
    description: 'Try on formal, casual, cultural, and decade-inspired outfits',
  },
  facial: {
    name: 'Facial Features',
    icon: '✨',
    description: 'Refine nose, jawline, eyes, lips, and cheekbones',
  },
  body: {
    name: 'Body & Shape',
    icon: '💪',
    description: 'Transform body shape and proportions',
  },
  'age-fantasy': {
    name: 'Age & Fantasy',
    icon: '🎭',
    description: 'Age transformations and fantasy character styles',
  },
};
```

**Step 2: Update SUBCATEGORIES with gender tags and new male subcategories**

Add gender field to subcategories that are gender-specific. Add new male-only subcategories:

```typescript
export const SUBCATEGORIES: Record<TransformationCategory, TransformationSubcategory[]> = {
  hairstyles: [
    { id: 'color', name: 'Color', icon: '🎨' },
    { id: 'style', name: 'Style', icon: '💇' },
    { id: 'length', name: 'Length', icon: '📏' },
    { id: 'facial-hair', name: 'Facial Hair', icon: '🧔', gender: 'male' },
  ],
  makeup: [
    // Female subcategories
    { id: 'lips', name: 'Lips', icon: '💋', gender: 'female' },
    { id: 'eyes', name: 'Eyes', icon: '👁️', gender: 'female' },
    { id: 'face', name: 'Face', icon: '🧖', gender: 'female' },
    { id: 'full-looks', name: 'Full Looks', icon: '💃' },
    // Male subcategories
    { id: 'skin', name: 'Skin', icon: '✨', gender: 'male' },
    { id: 'brows', name: 'Brows', icon: '🫤', gender: 'male' },
  ],
  // clothing, facial, body, age-fantasy: unchanged (no gender on subcategories)
  clothing: [
    { id: 'formal', name: 'Formal', icon: '🤵' },
    { id: 'casual', name: 'Casual', icon: '👕' },
    { id: 'cultural', name: 'Cultural', icon: '🌍' },
    { id: 'decades', name: 'Decades', icon: '⏳' },
  ],
  facial: [
    { id: 'nose', name: 'Nose', icon: '👃' },
    { id: 'jawline', name: 'Jawline', icon: '🗣️' },
    { id: 'eyes', name: 'Eyes', icon: '👀' },
    { id: 'lips', name: 'Lips', icon: '👄' },
    { id: 'cheekbones', name: 'Cheekbones', icon: '😘' },
  ],
  body: [
    { id: 'body', name: 'Body', icon: '🧑' },
  ],
  'age-fantasy': [
    { id: 'age', name: 'Age', icon: '⌛' },
    { id: 'fantasy', name: 'Fantasy', icon: '🧙' },
  ],
};
```

**Step 3: Verify lint passes**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 4: Commit**

```bash
git add src/constants/transformations.ts
git commit -m "feat: add gender-aware display names and male subcategories to CATEGORIES"
```

---

### Task 3: Tag all existing transformations with gender field

**Files:**
- Modify: `src/constants/transformations.ts`

**Step 1: Add `gender` field to existing transformations**

Apply gender tags per the design document:

- **Hairstyles — Color** (14 items): no `gender` field (neutral)
- **Hairstyles — Style**: add `gender: 'female'` to: `hair-style-bob`, `hair-style-pixie`, `hair-style-ponytail`, `hair-style-messy-bun`, `hair-style-bangs`
- **Hairstyles — Style**: add `gender: 'male'` to: `hair-style-buzz-cut`, `hair-style-undercut`
- **Hairstyles — Style**: remaining 11 items: no `gender` field (neutral)
- **Hairstyles — Length** (5 items): no `gender` field (neutral)
- **Makeup — all subcategories** (26 items): add `gender: 'female'` to every item
- **Clothing — Formal**: add `gender: 'male'` to `clothing-formal-tuxedo`; add `gender: 'female'` to `clothing-formal-evening-gown` and `clothing-formal-cocktail-dress`; `clothing-formal-business-suit` stays neutral
- **Clothing — Casual, Cultural, Decades**: no `gender` field (neutral)
- **Facial Features** (19 items): no `gender` field (neutral)
- **Body**: add `gender: 'female'` to `body-curvier`; rest stay neutral
- **Age & Fantasy** (18 items): no `gender` field (neutral)

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 3: Commit**

```bash
git add src/constants/transformations.ts
git commit -m "feat: tag existing transformations with gender field"
```

---

### Task 4: Add new male transformations

**Files:**
- Modify: `src/constants/transformations.ts`

**Step 1: Add male hairstyle transformations**

Add after existing hairstyle-style items. All have `gender: 'male'`, `category: 'hairstyles'`, `subcategory: 'style'`, `intensity: 0.70`:

| id | name | prompt | icon |
|----|------|--------|------|
| hair-style-fade | Fade | Change the person's hairstyle to a clean fade haircut | 💈 |
| hair-style-crew-cut | Crew Cut | Change the person's hairstyle to a classic crew cut | 🪖 |
| hair-style-slick-back | Slick Back | Change the person's hairstyle to a slicked back style | 🕴️ |
| hair-style-man-bun | Man Bun | Change the person's hairstyle to a man bun | 🔝 |
| hair-style-pompadour | Pompadour | Change the person's hairstyle to a classic pompadour | 🎵 |
| hair-style-quiff | Quiff | Change the person's hairstyle to a modern quiff | 💫 |
| hair-style-comb-over | Comb Over | Change the person's hairstyle to a side-parted comb over | ➡️ |
| hair-style-flat-top | Flat Top | Change the person's hairstyle to a flat top | ⬛ |

**Step 2: Add facial hair transformations**

New subcategory `facial-hair`. All have `gender: 'male'`, `category: 'hairstyles'`, `subcategory: 'facial-hair'`, `intensity: 0.70`:

| id | name | prompt | icon |
|----|------|--------|------|
| hair-facial-full-beard | Full Beard | Give the person a full thick beard | 🧔 |
| hair-facial-stubble | Stubble | Give the person light stubble facial hair | 🌫️ |
| hair-facial-goatee | Goatee | Give the person a goatee beard on the chin | 🎯 |
| hair-facial-mustache | Mustache | Give the person a classic mustache | 🥸 |
| hair-facial-handlebar | Handlebar Mustache | Give the person a handlebar mustache with curled ends | 〰️ |
| hair-facial-van-dyke | Van Dyke | Give the person a Van Dyke beard with mustache and pointed chin beard | 🎭 |
| hair-facial-mutton-chops | Mutton Chops | Give the person mutton chop sideburns | 🐑 |
| hair-facial-soul-patch | Soul Patch | Give the person a small soul patch below the lower lip | ▪️ |
| hair-facial-clean-shaven | Clean Shaven | Make the person completely clean shaven with no facial hair | ✨ |
| hair-facial-five-oclock | 5 O'Clock Shadow | Give the person a 5 o'clock shadow with slight stubble | 🕐 |
| hair-facial-lumberjack | Lumberjack Beard | Give the person a big rugged lumberjack beard | 🪓 |
| hair-facial-chinstrap | Chinstrap | Give the person a thin chinstrap beard along the jawline | ⛓️ |

**Step 3: Add male grooming transformations (male version of makeup)**

All have `gender: 'male'`, `category: 'makeup'`:

Skin subcategory (`subcategory: 'skin'`, `intensity: 0.60`):

| id | name | prompt | icon |
|----|------|--------|------|
| grooming-skin-clear | Clear Skin | Give the person clear blemish-free skin with a natural healthy look | ✨ |
| grooming-skin-bronzed | Bronzed | Give the person a sun-kissed bronzed skin tone | ☀️ |
| grooming-skin-matte | Matte Skin | Give the person smooth matte skin with no shine | 🪨 |
| grooming-skin-healthy-glow | Healthy Glow | Give the person healthy glowing skin with a natural radiance | 💡 |

Brows subcategory (`subcategory: 'brows'`, `intensity: 0.60`):

| id | name | prompt | icon |
|----|------|--------|------|
| grooming-brows-thick | Thick Brows | Give the person thick bold eyebrows | 🟫 |
| grooming-brows-groomed | Groomed Brows | Give the person neatly groomed and shaped eyebrows | ✂️ |
| grooming-brows-bushy | Bushy Brows | Give the person natural bushy eyebrows | 🌿 |

Full Looks subcategory (`subcategory: 'full-looks'`, `intensity: 0.60`):

| id | name | prompt | icon |
|----|------|--------|------|
| grooming-full-well-groomed | Well-Groomed | Give the person a polished well-groomed look with clean skin and neat facial hair | 👔 |
| grooming-full-rugged | Rugged | Give the person a rugged masculine look with textured skin and slight stubble | 🏔️ |
| grooming-full-pretty-boy | Pretty Boy | Give the person a refined pretty boy look with flawless skin and defined features | 💎 |
| grooming-full-distinguished | Distinguished | Give the person a distinguished mature look with subtle gray at the temples and refined features | 🎩 |

**Step 4: Add male clothing transformations**

Formal (`subcategory: 'formal'`, `gender: 'male'`, `intensity: 0.75`):

| id | name | prompt | icon |
|----|------|--------|------|
| clothing-formal-three-piece | Three-Piece Suit | Replace the person's outfit with a classic three-piece suit with vest | 🤵 |
| clothing-formal-military | Military Dress | Replace the person's outfit with a formal military dress uniform | 🎖️ |

Casual (`subcategory: 'casual'`, `gender: 'male'`, `intensity: 0.75`):

| id | name | prompt | icon |
|----|------|--------|------|
| clothing-casual-workwear | Workwear | Replace the person's outfit with rugged workwear with boots and denim | 🔧 |
| clothing-casual-biker | Biker | Replace the person's outfit with a leather biker jacket and boots | 🏍️ |

**Step 5: Add male body transformations**

(`subcategory: 'body'`, `gender: 'male'`, `intensity: 0.70`):

| id | name | prompt | icon |
|----|------|--------|------|
| body-broad-shoulders | Broad Shoulders | Give the person broader more muscular shoulders | 🔱 |
| body-lean-ripped | Lean & Ripped | Make the person appear lean and ripped with visible muscle definition | 🏋️ |

**Step 6: Verify lint passes**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 7: Commit**

```bash
git add src/constants/transformations.ts
git commit -m "feat: add male-specific transformations (hairstyles, facial hair, grooming, clothing, body)"
```

---

### Task 5: Add new female transformations

**Files:**
- Modify: `src/constants/transformations.ts`

**Step 1: Add female hairstyle transformations**

All have `gender: 'female'`, `category: 'hairstyles'`, `subcategory: 'style'`, `intensity: 0.70`:

| id | name | prompt | icon |
|----|------|--------|------|
| hair-style-french-twist | French Twist | Change the person's hairstyle to an elegant French twist updo | 🌀 |
| hair-style-side-swept | Side Swept | Change the person's hairstyle to a glamorous side-swept style | 💨 |
| hair-style-half-up | Half Up Half Down | Change the person's hairstyle to a half up half down style | ⬆️ |
| hair-style-space-buns | Space Buns | Change the person's hairstyle to playful space buns | 🪐 |
| hair-style-curtain-bangs | Curtain Bangs | Add curtain bangs to the person's hairstyle framing the face | 🪟 |
| hair-style-layered | Layered | Change the person's hairstyle to a layered cut with face-framing layers | 🍃 |

**Step 2: Add female clothing transformations**

Formal (`subcategory: 'formal'`, `gender: 'female'`, `intensity: 0.75`):

| id | name | prompt | icon |
|----|------|--------|------|
| clothing-formal-ball-gown | Ball Gown | Replace the person's outfit with a grand ball gown with flowing skirt | 👸 |
| clothing-formal-jumpsuit | Jumpsuit | Replace the person's outfit with a sleek tailored jumpsuit | 🦸‍♀️ |

Casual (`subcategory: 'casual'`, `gender: 'female'`, `intensity: 0.75`):

| id | name | prompt | icon |
|----|------|--------|------|
| clothing-casual-cottagecore | Cottagecore | Replace the person's outfit with a cottagecore outfit with floral dress and natural fabrics | 🌸 |
| clothing-casual-y2k-girly | Y2K Girly | Replace the person's outfit with Y2K girly fashion with low-rise and baby tees | 💖 |

**Step 3: Add female body transformations**

(`subcategory: 'body'`, `gender: 'female'`, `intensity: 0.70`):

| id | name | prompt | icon |
|----|------|--------|------|
| body-hourglass | Hourglass | Give the person an hourglass figure with defined waist | ⏳ |
| body-petite | Petite | Make the person appear petite with a smaller more delicate frame | 🌷 |

**Step 4: Verify lint passes**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 5: Commit**

```bash
git add src/constants/transformations.ts
git commit -m "feat: add female-specific transformations (hairstyles, clothing, body)"
```

---

### Task 6: Update helper functions with gender filtering

**Files:**
- Modify: `src/constants/transformations.ts`

**Step 1: Import Gender type and update helpers**

```typescript
import type { Transformation, TransformationCategory, TransformationSubcategory } from '@/types';
import type { Gender } from '@/types';

// Add new helper for filtering subcategories by gender
export function getSubcategoriesForGender(
  category: TransformationCategory,
  gender: Gender | null,
): TransformationSubcategory[] {
  const subs = SUBCATEGORIES[category] ?? [];
  if (!gender) return subs.filter((s) => !s.gender);
  return subs.filter((s) => !s.gender || s.gender === gender);
}

// Update existing helpers with optional gender param
export function getTransformationsByCategory(
  category: TransformationCategory,
  gender?: Gender | null,
): Transformation[] {
  return TRANSFORMATIONS.filter(
    (t) => t.category === category && (!gender || !t.gender || t.gender === gender),
  );
}

export function getTransformationsBySubcategory(
  category: TransformationCategory,
  subcategory: string,
  gender?: Gender | null,
): Transformation[] {
  return TRANSFORMATIONS.filter(
    (t) =>
      t.category === category &&
      t.subcategory === subcategory &&
      (!gender || !t.gender || t.gender === gender),
  );
}

// getTransformationById stays unchanged
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 3: Commit**

```bash
git add src/constants/transformations.ts
git commit -m "feat: add gender filtering to transformation helper functions"
```

---

### Task 7: Update CategoryNav to show gender-aware names

**Files:**
- Modify: `src/components/studio/CategoryNav.tsx`

**Step 1: Accept gender prop and use gender-aware display**

```typescript
import type { Gender } from '@/types';

interface CategoryNavProps {
  selectedCategory: TransformationCategory;
  onSelectCategory: (category: TransformationCategory) => void;
  gender: Gender | null;
}

function CategoryNav({ selectedCategory, onSelectCategory, gender }: CategoryNavProps) {
  // In the render, compute display name and icon:
  const displayName = (gender === 'male' && category.maleName) ? category.maleName : category.name;
  const displayIcon = (gender === 'male' && category.maleIcon) ? category.maleIcon : category.icon;
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 3: Commit**

```bash
git add src/components/studio/CategoryNav.tsx
git commit -m "feat: display gender-aware category names in CategoryNav"
```

---

### Task 8: Update TransformationPicker to filter by gender

**Files:**
- Modify: `src/components/studio/TransformationPicker.tsx`

**Step 1: Accept gender prop and filter subcategories + transformations**

```typescript
import type { Gender } from '@/types';
import { CATEGORIES, getSubcategoriesForGender, getTransformationsBySubcategory } from '@/constants/transformations';

interface TransformationPickerProps {
  category: TransformationCategory;
  selectedSubcategory: string;
  onSelectSubcategory: (subcategory: string) => void;
  onSelectTransformation: (transformation: Transformation) => void;
  isDisabled: boolean;
  activeTransformationId: string | null;
  gender: Gender | null;
}

// In the component:
const subcategories = useMemo(
  () => getSubcategoriesForGender(category, gender),
  [category, gender],
);
const transformations = useMemo(
  () => getTransformationsBySubcategory(category, selectedSubcategory, gender),
  [category, selectedSubcategory, gender],
);
```

**Step 2: Verify lint passes**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 3: Commit**

```bash
git add src/components/studio/TransformationPicker.tsx
git commit -m "feat: filter transformations and subcategories by gender in TransformationPicker"
```

---

### Task 9: Thread gender through MakeoverStudio

**Files:**
- Modify: `src/components/studio/MakeoverStudio.tsx`

**Step 1: Destructure selectedGender from useApp and pass to children**

```typescript
const { selectedGender, /* ...existing destructured values */ } = useApp();
```

Pass to CategoryNav:
```tsx
<CategoryNav
  selectedCategory={selectedCategory}
  onSelectCategory={handleCategoryChange}
  gender={selectedGender}
/>
```

Pass to TransformationPicker:
```tsx
<TransformationPicker
  category={selectedCategory}
  selectedSubcategory={selectedSubcategory}
  onSelectSubcategory={setSelectedSubcategory}
  onSelectTransformation={handleSelectTransformation}
  isDisabled={isGenerating || isEnhancing}
  activeTransformationId={currentTransformation?.id ?? null}
  gender={selectedGender}
/>
```

Also update `handleCategoryChange` to reset subcategory using gender-filtered subcategories:

```typescript
import { CATEGORIES, SUBCATEGORIES, getSubcategoriesForGender } from '@/constants/transformations';

const handleCategoryChange = useCallback((category: TransformationCategory) => {
  setSelectedCategory(category);
  const subcategories = getSubcategoriesForGender(category, selectedGender);
  if (subcategories.length > 0) {
    setSelectedSubcategory(subcategories[0].id);
  }
}, [selectedGender]);
```

And update initial subcategory state to be gender-aware (use an effect or compute from selectedGender).

**Step 2: Verify lint and useEffect validation pass**

Run: `npm run lint && npm run validate:useeffect`
Expected: 0 warnings, 0 errors

**Step 3: Commit**

```bash
git add src/components/studio/MakeoverStudio.tsx
git commit -m "feat: thread selectedGender through MakeoverStudio to CategoryNav and TransformationPicker"
```

---

### Task 10: Final validation and build check

**Step 1: Run full lint**

Run: `npm run lint`
Expected: 0 warnings, 0 errors

**Step 2: Run useEffect validation**

Run: `npm run validate:useeffect`
Expected: PASS

**Step 3: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 4: Commit any remaining fixes if needed**
