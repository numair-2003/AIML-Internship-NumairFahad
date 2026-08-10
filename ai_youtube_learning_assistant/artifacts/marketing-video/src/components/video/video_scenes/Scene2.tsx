import { motion } from 'framer-motion';

export const Scene2 = () => {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-12"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="mb-8 w-full max-w-6xl flex justify-between items-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        <div>
          <h2 className="text-4xl font-display font-bold text-white mb-2">AI Chat with Citations</h2>
          <p className="text-lg text-[var(--color-text-muted)]">Ask anything. Get exact timestamps.</p>
        </div>
      </motion.div>

      <div className="w-full max-w-6xl h-[60vh] glass-panel rounded-3xl overflow-hidden flex shadow-2xl relative">
        {/* Left Side: Video Player Mockup */}
        <motion.div
          className="w-[55%] border-r border-white/10 bg-black/40 p-6 flex flex-col relative"
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.8, ease: 'easeOut' }}
        >
          {/* Video Placeholder */}
          <div className="flex-1 rounded-xl bg-gray-900 overflow-hidden relative group">
            <div className="absolute inset-0 flex items-center justify-center text-white/20 group-hover:scale-110 transition-transform duration-700">
              <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
            </div>
            {/* Scrubber */}
            <div className="absolute bottom-4 left-4 right-4 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)]"
                initial={{ width: '0%' }}
                animate={{ width: '35%' }}
                transition={{ duration: 5, delay: 2, ease: 'linear' }}
              />
            </div>
          </div>
          <div className="mt-4 flex gap-4">
            <div className="h-4 w-3/4 bg-white/10 rounded-full" />
            <div className="h-4 w-1/4 bg-white/5 rounded-full" />
          </div>
        </motion.div>

        {/* Right Side: Chat Interface */}
        <div className="flex-1 bg-black/20 p-6 flex flex-col relative overflow-hidden">
          <div className="flex-1 flex flex-col gap-6 justify-end pb-6">
            
            {/* User Message */}
            <motion.div
              className="self-end max-w-[85%] bg-white/10 text-white p-4 rounded-2xl rounded-tr-sm backdrop-blur-md border border-white/5"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 1.5, type: 'spring', damping: 20 }}
            >
              What is the main argument about neural networks here?
            </motion.div>

            {/* AI Message */}
            <motion.div
              className="self-start max-w-[90%] bg-gradient-to-br from-[var(--color-bg-dark)] to-[#1a1c3a] text-white p-5 rounded-2xl rounded-tl-sm border border-[var(--color-primary)]/30 shadow-[0_0_20px_rgba(90,95,207,0.15)] relative"
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, delay: 3, type: 'spring', damping: 20 }}
            >
              <div className="absolute -left-3 -top-3 w-8 h-8 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center shadow-lg border-2 border-[var(--color-bg-dark)]">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <p className="leading-relaxed">
                The speaker argues that adding depth allows networks to learn hierarchical representations. 
                They explain the backpropagation mechanism at <motion.span 
                  className="inline-flex items-center gap-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] px-2 py-0.5 rounded-md font-mono text-sm border border-[var(--color-primary)]/30 ml-1 cursor-pointer"
                  initial={{ backgroundColor: 'rgba(90,95,207,0.2)' }}
                  animate={{ backgroundColor: ['rgba(90,95,207,0.2)', 'rgba(90,95,207,0.6)', 'rgba(90,95,207,0.2)'] }}
                  transition={{ delay: 4.5, duration: 1.5 }}
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  02:15
                </motion.span>
                , noting it's the core engine of deep learning.
              </p>
            </motion.div>

          </div>

          {/* Input Area */}
          <motion.div
            className="h-14 bg-white/5 rounded-xl border border-white/10 flex items-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            <div className="w-4 h-4 rounded-full border-2 border-white/30 animate-pulse mr-3" />
            <div className="h-4 w-32 bg-white/20 rounded" />
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
};
