import { motion } from 'framer-motion';
import { useApp } from '@/context/AppContext';
import Button from '@/components/common/Button';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
  },
};

const sampleGradients = [
  'from-rose-500 to-pink-600',
  'from-purple-500 to-indigo-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-blue-500 to-cyan-600',
  'from-fuchsia-500 to-purple-600',
];

function LandingHero() {
  const { setCurrentView } = useApp();

  return (
    <section className="relative flex h-full flex-col overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-rose-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative flex min-h-0 flex-1 flex-col items-center justify-center px-4 sm:px-6 lg:px-8"
      >
        <div className="text-center">
          <motion.div variants={itemVariants}>
            <span className="inline-flex items-center gap-2 rounded-full border border-rose-500/20 bg-rose-500/5 px-4 py-1.5 text-sm text-rose-400">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
              AI-Powered Makeover
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-7xl"
          >
            <span className="block">Transform Your</span>
            <span className="mt-1 block bg-gradient-to-r from-rose-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              Look with AI
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mx-auto mt-4 max-w-xl text-base text-white/50 sm:text-lg"
          >
            Try new hairstyles, makeup, and styles instantly. See how you look before making any real changes.
          </motion.p>

          <motion.div variants={itemVariants} className="mt-8 flex flex-col items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => setCurrentView('capture')}
              className="text-lg shadow-xl shadow-rose-500/20"
            >
              Start Your Makeover
            </Button>
            <p className="text-sm text-white/30">
              No sign-up required &bull; Free to try
            </p>
          </motion.div>
        </div>

        {/* Sample previews grid */}
        <motion.div
          variants={itemVariants}
          className="mx-auto mt-10 w-full max-w-2xl"
        >
          <p className="mb-4 text-center text-xs font-medium text-white/30">
            Sample Transformations
          </p>
          <div className="grid grid-cols-6 gap-3">
            {sampleGradients.map((gradient, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.05, y: -4 }}
                transition={{ duration: 0.2 }}
                className={`aspect-square rounded-xl bg-gradient-to-br ${gradient} opacity-60 transition-opacity hover:opacity-100`}
              >
                <div className="flex h-full items-center justify-center text-xl opacity-70">
                  {['💇', '💄', '👗', '🪞', '🏋️', '🧙'][index]}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

export default LandingHero;
