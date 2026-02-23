import { motion } from 'framer-motion';
import { useTransformationHistory } from '@/hooks/useTransformationHistory';
import { useApp } from '@/context/AppContext';
import Button from '@/components/common/Button';

function HistoryGallery() {
  const { items, clearAll } = useTransformationHistory();
  const { setCurrentTransformation } = useApp();

  if (items.length === 0) {
    return null;
  }

  const handleItemClick = (item: typeof items[0]) => {
    setCurrentTransformation(item.transformation);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-white/50">
          History ({items.length})
        </h3>
        <Button variant="ghost" size="sm" onClick={clearAll}>
          Clear History
        </Button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.map((item, index) => (
          <motion.button
            key={item.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleItemClick(item)}
            className="group flex-shrink-0"
          >
            <div className="w-20 overflow-hidden rounded-xl border border-white/10 transition-all group-hover:border-rose-500/30 sm:w-24 aspect-[4/5]">
              <img
                src={item.resultImage}
                alt={item.transformation.name}
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-1.5 max-w-[80px] truncate text-center text-[10px] text-white/30 group-hover:text-white/50 sm:max-w-[96px]">
              {item.transformation.name}
            </p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

export default HistoryGallery;
