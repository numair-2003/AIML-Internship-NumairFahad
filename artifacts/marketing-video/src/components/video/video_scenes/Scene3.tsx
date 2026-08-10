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
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-[4vw]"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2 
        className="text-[4vw] font-display font-bold text-white mb-[5vh] text-center leading-none"
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Your entire study toolkit. <span className="text-[var(--color-secondary)]">Generated.</span>
      </motion.h2>

      <div className="w-[75vw] flex gap-[2vw] h-[55vh]">
        {/* Sidebar Nav */}
        <motion.div 
          className="w-[18vw] glass-panel rounded-[2vw] p-[1vw] flex flex-col gap-[1vw]"
          initial={{ x: -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1, delay: 0.8 }}
        >
          {['summary', 'quiz', 'flashcards'].map((tab, idx) => (
            <motion.div
              key={tab}
              className={`p-[1vw] rounded-[1vw] flex items-center gap-[1vw] transition-colors duration-500 relative ${activeTab === tab ? 'text-white' : 'text-white/40'}`}
            >
              {activeTab === tab && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 border border-white/20 rounded-[1vw] z-0"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <div className="z-10 capitalize font-medium text-[1.2vw] flex items-center gap-[1vw]">
                {idx === 0 && <svg className="w-[1.5vw] h-[1.5vw]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>}
                {idx === 1 && <svg className="w-[1.5vw] h-[1.5vw]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {idx === 2 && <svg className="w-[1.5vw] h-[1.5vw]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>}
                {tab}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Content Area */}
        <motion.div 
          className="flex-1 glass-panel rounded-[2vw] p-[2vw] relative overflow-hidden"
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
              <div className="w-[10vw] h-[2vw] bg-[var(--color-primary)]/20 rounded-md mb-[1.5vw] animate-pulse" />
              <div className="space-y-[1vw]">
                <div className="h-[1vw] w-full bg-white/10 rounded" />
                <div className="h-[1vw] w-11/12 bg-white/10 rounded" />
                <div className="h-[1vw] w-full bg-white/10 rounded" />
                <div className="h-[1vw] w-4/5 bg-white/10 rounded" />
              </div>
              <div className="mt-[2vw] space-y-[1vw]">
                <div className="flex gap-[1vw]">
                  <div className="w-[1vw] h-[1vw] rounded-full bg-[var(--color-secondary)]/50 mt-[0.25vw]" />
                  <div className="flex-1 space-y-[0.5vw]">
                    <div className="h-[1vw] w-full bg-white/10 rounded" />
                    <div className="h-[1vw] w-2/3 bg-white/10 rounded" />
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
              <h3 className="text-[1.8vw] font-semibold mb-[1.5vw]">Question 1 of 5</h3>
              <p className="text-[1.5vw] mb-[2vw]">What is the primary function of the backpropagation algorithm?</p>
              
              <div className="space-y-[1vw]">
                {[1, 2, 3].map((_, i) => (
                  <motion.div
                    key={i}
                    className={`p-[1vw] rounded-[1vw] border ${i === 1 ? 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-white' : 'border-white/10 text-white/60'} flex items-center gap-[1vw]`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 * i }}
                  >
                    <div className={`w-[1.5vw] h-[1.5vw] rounded-full border ${i === 1 ? 'border-[var(--color-primary)] bg-[var(--color-primary)] flex items-center justify-center' : 'border-white/20'}`}>
                      {i === 1 && <div className="w-[0.5vw] h-[0.5vw] bg-white rounded-full" />}
                    </div>
                    <div className="h-[1vw] w-3/4 bg-white/20 rounded" />
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
                className="w-[30vw] h-[40vh] bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] rounded-[2vw] p-[2vw] flex flex-col items-center justify-center text-center shadow-2xl relative cursor-pointer"
                animate={{ rotateY: [0, 180, 180] }}
                transition={{ duration: 4, times: [0, 0.2, 1], repeat: Infinity, repeatDelay: 1 }}
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div className="absolute inset-0 flex items-center justify-center backface-hidden p-[2vw]" style={{ backfaceVisibility: 'hidden' }}>
                  <h4 className="text-[2.2vw] font-bold">Gradient Descent</h4>
                </div>
                <div className="absolute inset-0 flex items-center justify-center p-[2vw] bg-[#1a1c3a] rounded-[2vw] border-[0.2vw] border-[var(--color-secondary)] text-[1.3vw]" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
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
