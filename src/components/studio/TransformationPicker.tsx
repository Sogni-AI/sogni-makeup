import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TransformationCategory, Transformation, Gender } from '@/types';
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

const gridContainerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.03 },
  },
};

const gridItemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 },
};

function TransformationPicker({
  category,
  selectedSubcategory,
  onSelectSubcategory,
  onSelectTransformation,
  isDisabled,
  activeTransformationId,
  gender,
}: TransformationPickerProps) {
  const subcategories = useMemo(
    () => getSubcategoriesForGender(category, gender),
    [category, gender],
  );
  const transformations = useMemo(
    () => getTransformationsBySubcategory(category, selectedSubcategory, gender),
    [category, selectedSubcategory, gender],
  );

  if (!CATEGORIES[category]) return null;

  return (
    <div className="flex min-h-0 flex-col">
      {/* Subcategory tabs */}
      <div className="subcategory-tabs flex-shrink-0">
        {subcategories.map((sub: { id: string; name: string; icon: string }) => {
          const isActive = selectedSubcategory === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => onSelectSubcategory(sub.id)}
              className={`relative flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                isActive
                  ? 'bg-primary-400/10 text-primary-300'
                  : 'text-white/35 hover:bg-primary-400/[0.04] hover:text-white/50'
              }`}
            >
              <span className="mr-1">{sub.icon}</span>
              {sub.name}
            </button>
          );
        })}
      </div>

      {/* Transformation grid (scrollable) */}
      <div className="min-h-0 flex-1 overflow-y-auto md:overflow-y-hidden md:overflow-x-auto">
        {transformations.length > 0 ? (
          <motion.div
            key={`${category}-${selectedSubcategory}`}
            variants={gridContainerVariants}
            initial="hidden"
            animate="visible"
            className="transformation-grid"
          >
            {transformations.map((transformation) => {
              const isActive = activeTransformationId === transformation.id;
              return (
                <motion.button
                  key={transformation.id}
                  variants={gridItemVariants}
                  transition={{ duration: 0.2 }}
                  whileHover={isDisabled ? undefined : { scale: 1.05 }}
                  whileTap={isDisabled ? undefined : { scale: 0.95 }}
                  onClick={() => !isDisabled && onSelectTransformation(transformation)}
                  className={`transformation-card ${isActive ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                  disabled={isDisabled}
                  aria-label={`Apply ${transformation.name} transformation`}
                >
                  <span className="text-2xl">{transformation.icon}</span>
                  <span className="text-xs font-medium leading-tight">{transformation.name}</span>
                </motion.button>
              );
            })}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center p-12">
            <p className="text-sm text-white/25">
              No transformations available for this subcategory.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransformationPicker;
