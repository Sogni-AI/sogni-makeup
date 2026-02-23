import { useCallback } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';

const samplePlaceholders = [
  { id: 'sample-1', gradient: 'from-rose-400 to-pink-600', label: 'Portrait 1' },
  { id: 'sample-2', gradient: 'from-amber-400 to-orange-600', label: 'Portrait 2' },
  { id: 'sample-3', gradient: 'from-emerald-400 to-teal-600', label: 'Portrait 3' },
  { id: 'sample-4', gradient: 'from-blue-400 to-indigo-600', label: 'Portrait 4' },
  { id: 'sample-5', gradient: 'from-purple-400 to-violet-600', label: 'Portrait 5' },
  { id: 'sample-6', gradient: 'from-fuchsia-400 to-pink-600', label: 'Portrait 6' },
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

      const gradient = ctx.createLinearGradient(0, 0, 512, 512);
      const sample = samplePlaceholders.find(s => s.id === sampleId);
      if (!sample) return;

      const colorMap: Record<string, [string, string]> = {
        'sample-1': ['#fb7185', '#db2777'],
        'sample-2': ['#fbbf24', '#ea580c'],
        'sample-3': ['#34d399', '#0d9488'],
        'sample-4': ['#60a5fa', '#4f46e5'],
        'sample-5': ['#a78bfa', '#7c3aed'],
        'sample-6': ['#e879f9', '#db2777'],
      };

      const [start, end] = colorMap[sampleId] || ['#fb7185', '#db2777'];
      gradient.addColorStop(0, start);
      gradient.addColorStop(1, end);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
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
      <p className="text-center text-sm font-medium text-white/30">
        Or try with a sample photo
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-6">
        {samplePlaceholders.map((sample) => (
          <motion.button
            key={sample.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSampleClick(sample.id)}
            className={`aspect-square rounded-xl bg-gradient-to-br ${sample.gradient} opacity-50 transition-opacity hover:opacity-80`}
            aria-label={`Use ${sample.label}`}
          >
            <div className="flex h-full items-center justify-center">
              <svg
                className="h-6 w-6 text-white/50"
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
      <p className="mt-2 text-center text-xs text-white/20">
        Sample photos for quick demo
      </p>
    </motion.div>
  );
}

export default SamplePhotos;
