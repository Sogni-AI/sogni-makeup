import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

const femaleSamples = [
  { id: 'sample-f1', src: '/images/woman1.jpg', label: 'Female Portrait 1' },
  { id: 'sample-f2', src: '/images/woman2.jpg', label: 'Female Portrait 2' },
];

const maleSamples = [
  { id: 'sample-m1', src: '/images/man1.jpg', label: 'Male Portrait 1' },
  { id: 'sample-m2', src: '/images/man2.jpg', label: 'Male Portrait 2' },
];

function SamplePhotos() {
  const { setOriginalImage, setCurrentView, selectedGender } = useApp();

  const samples = selectedGender === 'male' ? maleSamples : femaleSamples;

  const handleSampleClick = useCallback(
    (src: string, id: string) => {
      fetch(src)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `${id}.jpg`, { type: 'image/jpeg' });
          setOriginalImage(file);
          setCurrentView('studio');
        });
    },
    [setOriginalImage, setCurrentView]
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="mt-12"
    >
      <p className="text-center text-[11px] font-medium uppercase tracking-[0.2em] text-white/20">
        Or try with a sample photo
      </p>
      <div className="mx-auto mt-4 grid max-w-[200px] grid-cols-2 gap-2">
        {samples.map((sample) => (
          <motion.button
            key={sample.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSampleClick(sample.src, sample.id)}
            className="aspect-[4/5] overflow-hidden rounded-xl border border-primary-400/[0.06] transition-all hover:border-primary-400/15"
            aria-label={`Use ${sample.label}`}
          >
            <img
              src={sample.src}
              alt={sample.label}
              className="h-full w-full object-cover"
            />
          </motion.button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-white/15">
        Sample photos for quick demo
      </p>
    </motion.div>
  );
}

export default SamplePhotos;
