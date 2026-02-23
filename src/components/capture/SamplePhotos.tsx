import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

const samplePlaceholders = [
  { id: 'sample-1', color1: '#d4a373', color2: '#a87b52', label: 'Portrait 1' },
  { id: 'sample-2', color1: '#c4756e', color2: '#813c34', label: 'Portrait 2' },
  { id: 'sample-3', color1: '#8c6342', color2: '#614531', label: 'Portrait 3' },
  { id: 'sample-4', color1: '#c2956b', color2: '#745239', label: 'Portrait 4' },
  { id: 'sample-5', color1: '#b5615a', color2: '#5c2f2b', label: 'Portrait 5' },
  { id: 'sample-6', color1: '#a87b52', color2: '#352318', label: 'Portrait 6' },
];

function SamplePhotos() {
  const { setOriginalImage, setCurrentView } = useApp();

  const handleSampleClick = useCallback(
    (sampleId: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const sample = samplePlaceholders.find(s => s.id === sampleId);
      if (!sample) return;

      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      gradient.addColorStop(0, sample.color1);
      gradient.addColorStop(1, sample.color2);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Sample Photo', 256, 256);

      canvas.toBlob(
        (blob) => {
          if (!blob) return;
          const file = new File([blob], `${sampleId}.jpg`, { type: 'image/jpeg' });
          setOriginalImage(file);
          setCurrentView('studio');
        },
        'image/jpeg',
        0.9
      );
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
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {samplePlaceholders.map((sample) => (
          <motion.button
            key={sample.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSampleClick(sample.id)}
            className="aspect-square rounded-xl border border-primary-400/[0.06] bg-surface-900/40 opacity-50 transition-all hover:border-primary-400/15 hover:opacity-80"
            style={{
              background: `linear-gradient(135deg, ${sample.color1}30, ${sample.color2}20)`,
            }}
            aria-label={`Use ${sample.label}`}
          >
            <div className="flex h-full items-center justify-center">
              <svg
                className="h-6 w-6 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
            </div>
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
