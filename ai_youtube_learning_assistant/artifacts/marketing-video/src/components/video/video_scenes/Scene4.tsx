import { motion } from 'framer-motion';

export const Scene4 = () => {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1.5, ease: 'easeInOut' }}
    >
      <motion.div
        className="text-center mb-16"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-6xl font-display font-bold mb-4">
          Learn <span className="text-gradient">faster.</span>
        </h2>
        <h2 className="text-6xl font-display font-bold">
          Retain <span className="text-gradient text-[var(--color-secondary)]">more.</span>
        </h2>
      </motion.div>

      <motion.div
        className="flex flex-col items-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-tr from-[#5a5fcf] to-[#7c3aed] shadow-[0_0_30px_rgba(90,95,207,0.5)]">
            <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <span className="text-4xl font-display font-bold tracking-tight">
            LearnTube
          </span>
        </div>
        
        <motion.div
          className="text-[var(--color-accent)] font-mono tracking-widest uppercase text-sm mt-4 border border-[var(--color-accent)]/30 px-6 py-2 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 2.5 }}
        >
          learntube.ai
        </motion.div>
      </motion.div>
      
      {/* Central burst effect */}
      <motion.div
        className="absolute inset-0 z-[-1] bg-[var(--color-primary)] mix-blend-screen pointer-events-none"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: [0, 0.15, 0], scale: [0, 2, 4] }}
        transition={{ duration: 2, delay: 1.2, ease: 'easeOut' }}
      />
    </motion.div>
  );
};
