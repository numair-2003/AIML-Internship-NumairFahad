import { motion } from 'framer-motion';

export const Scene0 = () => {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Logo Mark */}
      <motion.div
        className="flex items-center gap-6 mb-8"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          className="w-20 h-20 rounded-2xl flex items-center justify-center bg-gradient-to-tr from-[#5a5fcf] to-[#7c3aed] shadow-[0_0_40px_rgba(90,95,207,0.5)]"
          initial={{ scale: 0.5, rotate: -20, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 0.4, type: 'spring', stiffness: 100, damping: 20 }}
        >
          {/* Play Triangle */}
          <svg className="w-10 h-10 text-white ml-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </motion.div>

        <h1 className="text-7xl font-display font-bold tracking-tight">
          <span className="text-gradient">Learn</span>
          <span className="text-white">Tube</span>
        </h1>
      </motion.div>

      {/* Tagline */}
      <div className="overflow-hidden">
        <motion.p
          className="text-2xl text-[var(--color-text-muted)] font-medium max-w-2xl text-center leading-relaxed"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Turn any YouTube video into an <span className="text-white font-semibold">interactive learning experience</span>.
        </motion.p>
      </div>
      
      {/* Decorative accent lines */}
      <motion.div
        className="absolute bottom-20 left-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#5a5fcf] to-transparent"
        initial={{ width: 0, x: '-50%', opacity: 0 }}
        animate={{ width: '40vw', x: '-50%', opacity: 0.5 }}
        transition={{ duration: 1.5, delay: 1.5, ease: 'easeInOut' }}
      />
    </motion.div>
  );
};
