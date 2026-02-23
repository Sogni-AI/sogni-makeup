import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import Button from '@/components/common/Button';

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
  const { setCurrentView } = useApp();

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
          <motion.div variants={itemVariants} className="mx-auto mt-6 flex items-center gap-3">
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
            <Button
              variant="primary"
              size="lg"
              onClick={() => setCurrentView('capture')}
              className="text-lg shadow-xl shadow-primary-400/10"
            >
              Start Your Makeover
            </Button>
            <p className="text-sm font-light tracking-wide text-white/20">
              No sign-up required &bull; Free to try
            </p>
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
