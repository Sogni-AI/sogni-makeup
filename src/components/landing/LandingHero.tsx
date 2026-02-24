import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import type { Gender } from '@/types';
import Button from '@/components/common/Button';
import { VenusIcon, MarsIcon } from './GenderIcons';

type ImagePair = { before: string; after: string };

const femalePairs: ImagePair[] = [
  { before: '/images/before1.png', after: '/images/after1.png' },
  { before: '/images/before3.png', after: '/images/after3.png' },
  { before: '/images/before4.png', after: '/images/after4.png' },
  { before: '/images/before5.png', after: '/images/after5.png' },
  { before: '/images/before9.png', after: '/images/after9.png' },
];

const malePairs: ImagePair[] = [
  { before: '/images/before2.png', after: '/images/after2.png' },
  { before: '/images/before6.png', after: '/images/after6.png' },
  { before: '/images/before7.png', after: '/images/after7.png' },
  { before: '/images/before8.png', after: '/images/after8.png' },
];

// Interleave female/male so keyboard navigation alternates genders
const allPairs: ImagePair[] = [];
for (let i = 0; i < Math.max(femalePairs.length, malePairs.length); i++) {
  if (i < femalePairs.length) allPairs.push(femalePairs[i]);
  if (i < malePairs.length) allPairs.push(malePairs[i]);
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  },
};

const sampleCategories = [
  { label: 'Hair', icon: '&#9986;' },
  { label: 'Makeup', icon: '&#9688;' },
  { label: 'Style', icon: '&#9830;' },
  { label: 'Color', icon: '&#9675;' },
  { label: 'Sculpt', icon: '&#9651;' },
  { label: 'Explore', icon: '&#10023;' },
];

function LandingHero() {
  const { setCurrentView, setSelectedGender } = useApp();
  const [showGenderSelect, setShowGenderSelect] = useState(false);
  const [hoveredGender, setHoveredGender] = useState<Gender | null>(null);
  const [activeTileIndex, setActiveTileIndex] = useState(0);
  const [isTilesHovered, setIsTilesHovered] = useState(false);

  // Portrait slideshow state
  const [portraitDisplay, setPortraitDisplay] = useState({
    layers: [
      { before: femalePairs[0].before, after: femalePairs[0].after },
      { before: femalePairs[0].before, after: femalePairs[0].after },
    ] as [ImagePair, ImagePair],
    activeLayer: 0 as 0 | 1,
  });
  const lastGenderRef = useRef<'female' | 'male'>('female');
  const shuffleBagRef = useRef<Record<string, number[]>>({ female: [], male: [] });
  const hoverIndexRef = useRef<Record<string, number>>({ female: 0, male: 0 });
  const keyboardIndexRef = useRef(0);
  const keyboardGenderIndexRef = useRef(0);
  const hoveredGenderRef = useRef<Gender | null>(null);
  const prevHoveredGenderRef = useRef<Gender | null>(null);
  const [idleResetKey, setIdleResetKey] = useState(0);

  const transitionTo = useCallback((pair: ImagePair) => {
    setPortraitDisplay(prev => {
      const inactive = prev.activeLayer === 0 ? 1 : 0;
      const newLayers = [...prev.layers] as [ImagePair, ImagePair];
      newLayers[inactive] = pair;
      return { layers: newLayers, activeLayer: inactive as 0 | 1 };
    });
  }, []);

  const pickNextPair = useCallback((gender: 'female' | 'male', lastShown?: number): ImagePair => {
    const pairs = gender === 'female' ? femalePairs : malePairs;
    let bag = shuffleBagRef.current[gender];
    if (bag.length === 0) {
      // Refill: all indices, shuffled (Fisher-Yates)
      bag = Array.from({ length: pairs.length }, (_, i) => i);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      // Avoid repeating the last-shown pair across reshuffles
      if (bag[0] === lastShown && bag.length > 1) {
        const swapIdx = 1 + Math.floor(Math.random() * (bag.length - 1));
        [bag[0], bag[swapIdx]] = [bag[swapIdx], bag[0]];
      }
      shuffleBagRef.current[gender] = bag;
    }
    const nextIdx = bag.shift()!;
    return pairs[nextIdx];
  }, []);

  // Keep hoveredGenderRef in sync so keyboard handler can read it
  useEffect(() => {
    hoveredGenderRef.current = hoveredGender;
    keyboardGenderIndexRef.current = 0;
  }, [hoveredGender]);

  // Keyboard arrow navigation for portrait slideshow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      e.preventDefault();
      const delta = e.key === 'ArrowRight' ? 1 : -1;
      const hGender = hoveredGenderRef.current;

      if (hGender) {
        // Gender-specific: only cycle through hovered gender's pairs
        const pairs = hGender === 'female' ? femalePairs : malePairs;
        const len = pairs.length;
        keyboardGenderIndexRef.current = (keyboardGenderIndexRef.current + delta + len) % len;
        transitionTo(pairs[keyboardGenderIndexRef.current]);
        lastGenderRef.current = hGender;
      } else {
        // Idle: cycle through interleaved pairs (alternating genders)
        const len = allPairs.length;
        keyboardIndexRef.current = (keyboardIndexRef.current + delta + len) % len;
        const pair = allPairs[keyboardIndexRef.current];
        transitionTo(pair);
        // Determine gender of current pair for idle rotation continuity
        lastGenderRef.current = femalePairs.includes(pair) ? 'female' : 'male';
      }
      // Reset idle timer
      setIdleResetKey(k => k + 1);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Portrait rotation effect
  useEffect(() => {
    if (hoveredGender) {
      const pairs = hoveredGender === 'female' ? femalePairs : malePairs;

      // Only show immediate transition when hoveredGender actually changed,
      // not when re-triggered by keyboard reset (idleResetKey)
      if (prevHoveredGenderRef.current !== hoveredGender) {
        const idx = hoverIndexRef.current[hoveredGender] % pairs.length;
        transitionTo(pairs[idx]);
        hoverIndexRef.current[hoveredGender] = idx + 1;
      }
      prevHoveredGenderRef.current = hoveredGender;
      lastGenderRef.current = hoveredGender;

      // Rotate through same-gender pairs sequentially
      const interval = setInterval(() => {
        const nextIdx = hoverIndexRef.current[hoveredGender] % pairs.length;
        transitionTo(pairs[nextIdx]);
        hoverIndexRef.current[hoveredGender] = nextIdx + 1;
      }, 5000);
      return () => clearInterval(interval);
    }

    prevHoveredGenderRef.current = null;

    // Idle mode: alternate genders
    const lastShown: Record<string, number> = { female: 0, male: -1 };
    const interval = setInterval(() => {
      const nextGender = lastGenderRef.current === 'female' ? 'male' : 'female';
      const pair = pickNextPair(nextGender, lastShown[nextGender]);
      const pairs = nextGender === 'female' ? femalePairs : malePairs;
      lastShown[nextGender] = pairs.indexOf(pair);
      transitionTo(pair);
      lastGenderRef.current = nextGender;
    }, 5000);
    return () => clearInterval(interval);
  }, [hoveredGender, idleResetKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isTilesHovered) return;
    const interval = setInterval(() => {
      setActiveTileIndex((prev) => (prev + 1) % sampleCategories.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [isTilesHovered]);

  const handleTilesMouseEnter = useCallback(() => setIsTilesHovered(true), []);
  const handleTilesMouseLeave = useCallback(() => setIsTilesHovered(false), []);

  const handleSelectGender = (gender: Gender) => {
    setSelectedGender(gender);
    setCurrentView('capture');
  };

  return (
    <section className="relative flex h-full flex-col overflow-hidden">
      {/* Background ambient lighting */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/3 top-1/3 h-[500px] w-[500px] rounded-full bg-primary-400/[0.03] blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/3 h-[400px] w-[400px] rounded-full bg-secondary-400/[0.02] blur-[100px]" />
        {/* Decorative geometric lines */}
        <div className="absolute left-8 top-1/4 h-px w-32 bg-gradient-to-r from-transparent via-primary-400/15 to-transparent sm:left-16 sm:w-48" />
        <div className="absolute bottom-1/3 right-8 h-px w-32 bg-gradient-to-r from-transparent via-primary-400/10 to-transparent sm:right-16 sm:w-48" />
        <div className="absolute left-1/4 top-16 h-32 w-px bg-gradient-to-b from-transparent via-primary-400/8 to-transparent" />
      </div>

      {/* Before/After portrait images - mirrored flanking portraits */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        className="pointer-events-none absolute -left-3 top-0 h-full w-[45%] opacity-[0.08] sm:w-[44%] md:w-[44%] md:opacity-25 lg:-left-[calc(5%+10px)] lg:w-[38%] lg:opacity-100 xl:w-[35%]"
        style={{
          maskImage: 'linear-gradient(to right, black 0%, black 98%, transparent 100%), linear-gradient(to top, transparent 0%, black 15%, black 85%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskImage: 'linear-gradient(to right, black 0%, black 98%, transparent 100%), linear-gradient(to top, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskComposite: 'source-in',
        }}
      >
        {portraitDisplay.layers.map((layer, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-[opacity,transform] duration-700 ease-in-out"
            style={{
              backgroundImage: `url(${layer.before})`,
              backgroundSize: 'auto 100%',
              backgroundPosition: 'right center',
              backgroundRepeat: 'no-repeat',
              filter: 'sepia(0.15) saturate(0.85) brightness(0.9)',
              opacity: portraitDisplay.activeLayer === i ? 0.7 : 0,
              transform: portraitDisplay.activeLayer === i ? undefined : 'translateX(-20px)',
            }}
          />
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        className="pointer-events-none absolute -right-3 top-0 h-full w-[45%] opacity-[0.08] sm:w-[44%] md:w-[44%] md:opacity-25 lg:-right-[calc(5%+10px)] lg:w-[38%] lg:opacity-100 xl:w-[35%]"
        style={{
          maskImage: 'linear-gradient(to left, black 0%, black 98%, transparent 100%), linear-gradient(to top, transparent 0%, black 15%, black 85%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskImage: 'linear-gradient(to left, black 0%, black 98%, transparent 100%), linear-gradient(to top, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskComposite: 'source-in',
        }}
      >
        {portraitDisplay.layers.map((layer, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-[opacity,transform] duration-700 ease-in-out"
            style={{
              backgroundImage: `url(${layer.after})`,
              backgroundSize: 'auto 100%',
              backgroundPosition: 'left center',
              backgroundRepeat: 'no-repeat',
              filter: 'sepia(0.08) saturate(1.0) brightness(0.9)',
              opacity: portraitDisplay.activeLayer === i ? 0.75 : 0,
              transform: portraitDisplay.activeLayer === i ? undefined : 'translateX(20px)',
            }}
          />
        ))}
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center">
          {/* Pill badge */}
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-400/15 bg-primary-400/[0.04] px-4 py-1.5 text-sm tracking-wide text-primary-300/80">
              <span className="h-1 w-1 rounded-full bg-primary-400/60" />
              AI-Powered Atelier
            </span>
          </motion.div>

          {/* Hero heading - editorial serif */}
          <motion.h1
            variants={itemVariants}
            className="mt-8 font-display text-5xl font-medium tracking-tight sm:text-6xl lg:text-8xl"
          >
            <span className="block text-white/90">Transform Your</span>
            <span className="mt-1 block font-display italic">
              <span className="gradient-text">Look with AI</span>
            </span>
          </motion.h1>

          {/* Decorative line */}
          <motion.div variants={itemVariants} className="mx-auto mt-6 flex items-center justify-center gap-3">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary-400/30" />
            <div className="h-1.5 w-1.5 rotate-45 border border-primary-400/40" />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary-400/30" />
          </motion.div>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-6 max-w-lg text-base font-light leading-relaxed text-white/40 sm:text-lg"
          >
            Try new hairstyles, makeup, and styles instantly.
            See how you look before making any real changes.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-10 flex flex-col items-center gap-4">
            <AnimatePresence mode="wait">
              {!showGenderSelect ? (
                <motion.div
                  key="start-button"
                  initial={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.3 } }}
                  className="flex flex-col items-center gap-4"
                >
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={() => setShowGenderSelect(true)}
                    className="text-lg shadow-xl shadow-primary-400/10"
                  >
                    Start Your Makeover
                  </Button>
                  <p className="text-sm font-light tracking-wide text-white/20">
                    No sign-up required &bull; Free to try
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key="gender-select"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                  className="flex items-center gap-8 sm:gap-12"
                >
                  {/* Female icon */}
                  <motion.button
                    aria-label="Female"
                    initial={{ x: 30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1, transition: { delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredGender('female')}
                    onHoverEnd={() => setHoveredGender(null)}
                    onClick={() => handleSelectGender('female')}
                    className="group relative flex h-20 w-20 items-center justify-center rounded-full border border-primary-400/20 bg-surface-900/60 backdrop-blur-sm transition-all duration-300 hover:border-primary-400/40 hover:bg-primary-400/[0.08] hover:shadow-lg hover:shadow-primary-400/10 sm:h-24 sm:w-24 cursor-pointer"
                  >
                    <VenusIcon className="h-10 w-10 text-white/50 transition-colors duration-300 group-hover:text-primary-300 sm:h-12 sm:w-12" />
                  </motion.button>

                  {/* Divider */}
                  <div className="h-12 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

                  {/* Male icon */}
                  <motion.button
                    aria-label="Male"
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1, transition: { delay: 0.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] } }}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onHoverStart={() => setHoveredGender('male')}
                    onHoverEnd={() => setHoveredGender(null)}
                    onClick={() => handleSelectGender('male')}
                    className="group relative flex h-20 w-20 items-center justify-center rounded-full border border-primary-400/20 bg-surface-900/60 backdrop-blur-sm transition-all duration-300 hover:border-primary-400/40 hover:bg-primary-400/[0.08] hover:shadow-lg hover:shadow-primary-400/10 sm:h-24 sm:w-24 cursor-pointer"
                  >
                    <MarsIcon className="h-10 w-10 text-white/50 transition-colors duration-300 group-hover:text-primary-300 sm:h-12 sm:w-12" />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Sample category previews */}
        <motion.div
          variants={itemVariants}
          className="mx-auto mt-16 w-full max-w-lg"
        >
          <p className="mb-5 text-center text-[11px] font-medium uppercase tracking-[0.2em] text-white/20">
            Categories
          </p>
          <div
            className="grid grid-cols-6 gap-3"
            onMouseEnter={handleTilesMouseEnter}
            onMouseLeave={handleTilesMouseLeave}
          >
            {sampleCategories.map((cat, index) => {
              const isActive = !isTilesHovered && activeTileIndex === index;
              return (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.08, y: -3 }}
                  animate={isActive ? { scale: 1.08, y: -3 } : { scale: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                  className="group flex aspect-square cursor-default flex-col items-center justify-center gap-1.5 rounded-xl border bg-surface-900/40 transition-[border-color,background-color] duration-500 hover:border-primary-400/20 hover:bg-primary-400/[0.04]"
                  style={{
                    borderColor: isActive ? 'rgba(212, 163, 115, 0.2)' : 'rgba(212, 163, 115, 0.06)',
                    backgroundColor: isActive ? 'rgba(212, 163, 115, 0.04)' : undefined,
                  }}
                >
                  <span
                    className="text-lg transition-colors duration-500 group-hover:text-primary-300/60"
                    style={{ color: isActive ? 'rgba(232, 190, 126, 0.6)' : 'rgba(255,255,255,0.25)' }}
                    dangerouslySetInnerHTML={{ __html: cat.icon }}
                  />
                  <span
                    className="text-[9px] font-medium uppercase tracking-widest transition-colors duration-500 group-hover:text-white/40"
                    style={{ color: isActive ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.2)' }}
                  >
                    {cat.label}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default LandingHero;
