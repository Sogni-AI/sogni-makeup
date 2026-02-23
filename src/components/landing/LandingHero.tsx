import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import type { Gender } from '@/types';
import Button from '@/components/common/Button';
import { VenusIcon, MarsIcon } from './GenderIcons';

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
        className="pointer-events-none absolute left-0 top-0 h-full w-[55%] opacity-15 sm:w-[48%] md:w-[44%] md:opacity-35 lg:-left-[calc(5%-5px)] lg:w-[38%] lg:opacity-100 xl:w-[35%]"
        style={{
          maskImage: 'linear-gradient(to right, black 0%, black 98%, transparent 100%), linear-gradient(to top, transparent 0%, black 5%, black 95%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskImage: 'linear-gradient(to right, black 0%, black 98%, transparent 100%), linear-gradient(to top, transparent 0%, black 5%, black 95%, transparent 100%)',
          WebkitMaskComposite: 'source-in',
        }}
      >
        <img
          src="/images/before.png"
          alt=""
          className="h-full w-full object-cover object-right transition-[opacity,transform] duration-700 ease-in-out"
          style={{
            filter: 'sepia(0.15) saturate(0.85) brightness(0.9)',
            opacity: hoveredGender === 'male' ? 0 : 0.7,
            transform: hoveredGender === 'male' ? 'translateX(-20px)' : 'translateX(0)',
          }}
        />
        <img
          src="/images/before2.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-right transition-[opacity,transform] duration-700 ease-in-out"
          style={{
            filter: 'sepia(0.15) saturate(0.85) brightness(0.9)',
            opacity: hoveredGender === 'male' ? 0.7 : 0,
            transform: hoveredGender === 'male' ? 'translateX(0)' : 'translateX(-20px)',
          }}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
        className="pointer-events-none absolute right-0 top-0 h-full w-[55%] opacity-15 sm:w-[48%] md:w-[44%] md:opacity-35 lg:-right-[calc(5%-5px)] lg:w-[38%] lg:opacity-100 xl:w-[35%]"
        style={{
          maskImage: 'linear-gradient(to left, black 0%, black 98%, transparent 100%), linear-gradient(to top, transparent 0%, black 5%, black 95%, transparent 100%)',
          maskComposite: 'intersect',
          WebkitMaskImage: 'linear-gradient(to left, black 0%, black 98%, transparent 100%), linear-gradient(to top, transparent 0%, black 5%, black 95%, transparent 100%)',
          WebkitMaskComposite: 'source-in',
        }}
      >
        <img
          src="/images/after.png"
          alt=""
          className="h-full w-full object-cover object-left transition-[opacity,transform] duration-700 ease-in-out"
          style={{
            filter: 'sepia(0.08) saturate(1.0) brightness(0.9)',
            opacity: hoveredGender === 'male' ? 0 : 0.75,
            transform: hoveredGender === 'male' ? 'translateX(20px)' : 'translateX(0)',
          }}
        />
        <img
          src="/images/after2.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-left transition-[opacity,transform] duration-700 ease-in-out"
          style={{
            filter: 'sepia(0.08) saturate(1.0) brightness(0.9)',
            opacity: hoveredGender === 'male' ? 0.75 : 0,
            transform: hoveredGender === 'male' ? 'translateX(0)' : 'translateX(20px)',
          }}
        />
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
          <div className="grid grid-cols-6 gap-3">
            {sampleCategories.map((cat, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.08, y: -3 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="group flex aspect-square cursor-default flex-col items-center justify-center gap-1.5 rounded-xl border border-primary-400/[0.06] bg-surface-900/40 transition-all hover:border-primary-400/20 hover:bg-primary-400/[0.04]"
              >
                <span
                  className="text-lg text-white/25 transition-colors group-hover:text-primary-300/60"
                  dangerouslySetInnerHTML={{ __html: cat.icon }}
                />
                <span className="text-[9px] font-medium uppercase tracking-widest text-white/20 transition-colors group-hover:text-white/40">
                  {cat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default LandingHero;
