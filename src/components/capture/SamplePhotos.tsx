import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

const femaleSamples = [
  { id: 'sample-f1', src: '/images/before.png', label: 'Female Portrait 1' },
  { id: 'sample-f2', src: '/images/before3.png', label: 'Female Portrait 2' },
  { id: 'sample-f3', src: '/images/before4.png', label: 'Female Portrait 3' },
  { id: 'sample-f4', src: '/images/before5.png', label: 'Female Portrait 4' },
];

const maleSamples = [
  { id: 'sample-m1', src: '/images/before2.png', label: 'Male Portrait 1' },
  { id: 'sample-m2', src: '/images/before6.png', label: 'Male Portrait 2' },
  { id: 'sample-m3', src: '/images/before7.png', label: 'Male Portrait 3' },
  { id: 'sample-m4', src: '/images/before8.png', label: 'Male Portrait 4' },
];

function SamplePhotos() {
  const { setOriginalImage, setCurrentView, selectedGender } = useApp();

  const samples = selectedGender === 'male' ? maleSamples : femaleSamples;

  const handleSampleClick = useCallback(
    (src: string, id: string) => {
      fetch(src)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], `${id}.png`, { type: 'image/png' });
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
      <div className="mt-4 grid grid-cols-4 gap-3">
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
