import { motion } from 'framer-motion';
import { CATEGORIES } from '@/constants/transformations';
import type { TransformationCategory, Gender } from '@/types';

interface CategoryNavProps {
  selectedCategory: TransformationCategory;
  onSelectCategory: (category: TransformationCategory) => void;
  gender: Gender | null;
}

function CategoryNav({ selectedCategory, onSelectCategory, gender }: CategoryNavProps) {
  return (
    <nav className="studio-sidebar" aria-label="Transformation categories">
      {(Object.entries(CATEGORIES) as [TransformationCategory, typeof CATEGORIES[TransformationCategory]][]).map(([key, category]) => {
        const isActive = selectedCategory === key;
        const displayName = (gender === 'male' && category.maleName) ? category.maleName : category.name;
        const displayIcon = (gender === 'male' && category.maleIcon) ? category.maleIcon : category.icon;
        return (
          <motion.button
            key={key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectCategory(key)}
            className={`relative flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center transition-all md:px-3 ${
              isActive
                ? 'bg-primary-400/8 text-primary-300'
                : 'text-white/35 hover:bg-primary-400/[0.04] hover:text-white/50'
            }`}
            aria-label={displayName}
            aria-current={isActive ? 'true' : undefined}
          >
            {isActive && (
              <motion.div
                layoutId="category-highlight"
                className="absolute inset-0 rounded-xl border border-primary-400/15 bg-primary-400/[0.04]"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              />
            )}
            <span className="relative text-lg md:text-xl">{displayIcon}</span>
            <span className="relative text-center text-[10px] font-medium leading-tight md:text-xs">
              {displayName}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}

export default CategoryNav;
