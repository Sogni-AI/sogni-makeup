import { motion } from 'framer-motion';
import { CATEGORIES } from '@/constants/transformations';
import type { TransformationCategory } from '@/types';

interface CategoryNavProps {
  selectedCategory: TransformationCategory;
  onSelectCategory: (category: TransformationCategory) => void;
}

function CategoryNav({ selectedCategory, onSelectCategory }: CategoryNavProps) {
  return (
    <nav className="studio-sidebar" aria-label="Transformation categories">
      {(Object.entries(CATEGORIES) as [TransformationCategory, { name: string; icon: string; description: string }][]).map(([key, category]) => {
        const isActive = selectedCategory === key;
        return (
          <motion.button
            key={key}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onSelectCategory(key)}
            className={`relative flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center transition-all md:px-3 ${
              isActive
                ? 'bg-rose-500/10 text-rose-400'
                : 'text-white/40 hover:bg-white/5 hover:text-white/60'
            }`}
            aria-label={category.name}
            aria-current={isActive ? 'true' : undefined}
          >
            {isActive && (
              <motion.div
                layoutId="category-highlight"
                className="absolute inset-0 rounded-xl border border-rose-500/20 bg-rose-500/5"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              />
            )}
            <span className="relative text-lg md:text-xl">{category.icon}</span>
            <span className="relative text-center text-[10px] font-medium leading-tight md:text-xs">
              {category.name}
            </span>
          </motion.button>
        );
      })}
    </nav>
  );
}

export default CategoryNav;
