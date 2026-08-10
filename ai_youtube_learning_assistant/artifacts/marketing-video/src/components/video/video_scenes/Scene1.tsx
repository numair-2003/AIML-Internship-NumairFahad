import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const Scene1 = () => {
  const [url, setUrl] = useState('');
  const fullUrl = 'https://youtube.com/watch?v=dQw4w9WgXcQ';
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Typewriter effect for URL
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullUrl.length) {
        setUrl(fullUrl.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => setIsProcessing(true), 500);
      }
    }, 40);

    return () => clearInterval(typingInterval);
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="mb-12 text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <h2 className="text-5xl font-display font-bold text-white mb-4">Paste any video.</h2>
        <p className="text-xl text-[var(--color-text-muted)]">We handle the rest instantly.</p>
      </motion.div>

      <motion.div
        className="w-full max-w-3xl glass-panel rounded-2xl p-2 pl-6 flex items-center relative overflow-hidden"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.6, type: 'spring', stiffness: 100, damping: 20 }}
      >
        <svg className="w-6 h-6 text-[var(--color-text-muted)] mr-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        
        <div className="flex-1 text-xl font-body text-white font-medium truncate h-8 flex items-center">
          {url}
          {!isProcessing && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-0.5 h-6 bg-white ml-1"
            />
          )}
        </div>

        <motion.button
          className="ml-4 bg-gradient-to-r from-[#5a5fcf] to-[#7c3aed] text-white px-8 py-4 rounded-xl font-bold text-lg relative overflow-hidden shrink-0"
          animate={{
            width: isProcessing ? 160 : 'auto',
            scale: isProcessing ? 0.95 : 1,
          }}
          transition={{ duration: 0.4 }}
        >
          {isProcessing ? (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-6 h-6 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              />
            </motion.div>
          ) : (
            <motion.span exit={{ opacity: 0 }}>Process</motion.span>
          )}
        </motion.button>
        
        {/* Processing scan line */}
        {isProcessing && (
          <motion.div
            className="absolute top-0 bottom-0 w-32 bg-gradient-to-r from-transparent via-[rgba(124,58,237,0.3)] to-transparent"
            initial={{ left: '-20%' }}
            animate={{ left: '120%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};
