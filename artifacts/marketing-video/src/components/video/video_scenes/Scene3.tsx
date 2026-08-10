import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const Scene3 = () => {
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'quiz' | 'flashcards'

  useEffect(() => {
    const t1 = setTimeout(() => setActiveTab('quiz'), 5000);
    const t2 = setTimeout(() => setActiveTab('flashcards'), 10000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-12"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2 
        className="text-5xl font-display font-bold text-white mb-10 text-center"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Your entire study toolkit. <span className="text-[var(--color-secondary)]">Generated.</span>
      </motion.h2>

      <div className="w-full max-w-5xl flex gap-8 h-[55vh]">
        {/* Sidebar Nav */}
        <motion.div 
          className="w-64 glass-panel rounded-3xl p-4 flex flex-col gap-3"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          {['summary', 'quiz', 'flashcards'].map((tab, idx) => (
            <motion.div
              key={tab}
              className={`p-4 rounded-xl flex items-center gap-3 transition-colors duration-500 relative ${activeTab === tab ? 'text-white' : 'text-white/40'}`}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 border border-white/20 rounded-xl z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="z-10 capitalize font-medium text-lg flex items-center gap-3">
                {idx === 0 && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>}
                {idx === 1 && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {idx === 2 && <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                {tab}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Content Area */}
        <motion.div 
          className="flex-1 glass-panel rounded-3xl p-8 relative overflow-hidden"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
        >
          {activeTab === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col"
            >
              <div className="w-32 h-8 bg-[var(--color-primary)]/20 rounded-md mb-6 animate-pulse" />
              <div className="space-y-4">
                <div className="h-4 w-full bg-white/10 rounded" />
                <div className="h-4 w-11/12 bg-white/10 rounded" />
                <div className="h-4 w-full bg-white/10 rounded" />
                <div className="h-4 w-4/5 bg-white/10 rounded" />
              </div>
              <div className="mt-8 space-y-4">
                <div className="flex gap-4">
                  <div className="w-4 h-4 rounded-full bg-[var(--color-secondary)]/50 mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-full bg-white/10 rounded" />
                    <div className="h-4 w-2/3 bg-white/10 rounded" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col"
            >
              <h3 className="text-2xl font-semibold mb-6">Question 1 of 5</h3>
              <p className="text-xl mb-8">What is the primary function of the backpropagation algorithm?</p>
              
              <div className="space-y-4">
                {[1, 2, 3].map((opt, i) => (
                  <motion.div
                    key={i}
                    className={`p-4 rounded-xl border ${i === 1 ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-white' : 'border-white/10 text-white/60'} flex items-center gap-4`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 * i }}
                  >
                    <div className={`w-6 h-6 rounded-full border ${i === 1 ? 'border-[var(--color-primary)] bg-[var(--color-primary)] flex items-center justify-center' : 'border-white/20'}`}>
                      {i === 1 && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className="h-4 w-3/4 bg-white/20 rounded" />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'flashcards' && (
            <motion.div
              key="flashcards"
              initial={{ opacity: 0, scale: 0.9, rotateY: -90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="h-full flex items-center justify-center"
              style={{ perspective: 1000 }}
            >
              <motion.div 
                className="w-full max-w-md h-72 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl relative cursor-pointer"
                animate={{ rotateY: [0, 180, 180] }}
                transition={{ duration: 4, times: [0, 0.2, 1], repeat: Infinity, repeatDelay: 1 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="absolute inset-0 flex items-center justify-center backface-hidden p-8" style={{ backfaceVisibility: 'hidden' }}>
                  <h4 className="text-3xl font-bold">Gradient Descent</h4>
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-8 bg-[#1a1c3a] rounded-3xl border-2 border-[var(--color-secondary)] text-lg" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                  <p>The optimization algorithm used to minimize the cost function by iteratively moving in the direction of steepest descent.</p>
                </div>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};
