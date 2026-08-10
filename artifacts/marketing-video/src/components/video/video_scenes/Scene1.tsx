import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const Scene1 = () => {
  const [url, setUrl] = useState('');
  const fullUrl = 'https://youtube.com/watch?v=dQw4w9WgXcQ';
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    let i = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    
    const typingInterval = setInterval(() => {
      if (i < fullUrl.length) {
        setUrl(fullUrl.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
        timeoutId = setTimeout(() => setIsProcessing(true), 500);
      }
    }, 40);

    return () => {
      clearInterval(typingInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
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
        className="mb-[6vh] text-center"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <h2 className="text-[4.5vw] font-display font-bold text-white mb-[2vh] leading-none">Paste any video.</h2>
        <p className="text-[1.8vw] text-[var(--color-text-muted)]">We handle the rest instantly.</p>
      </motion.div>

      <motion.div
        className="w-[60vw] glass-panel rounded-[1.5vw] p-[0.5vw] pl-[1.5vw] flex items-center relative overflow-hidden"
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 0.6, type: 'spring', stiffness: 100, damping: 20 }}
      >
        <svg className="w-[2vw] h-[2vw] text-[var(--color-text-muted)] mr-[1vw] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        
        <div className="flex-1 text-[1.5vw] font-body text-white font-medium truncate h-[3vw] flex items-center">
          {url}
          {!isProcessing && (
            <motion.span
              animate={{ opacity: [1, 0] }}
              transition={{ repeat: Infinity, duration: 0.8 }}
              className="inline-block w-[0.2vw] h-[2vw] bg-white ml-[0.5vw]"
            />
          )}
        </div>

        <motion.button
          className="ml-[1vw] bg-gradient-to-r from-[#5a5fcf] to-[#7c3aed] text-white px-[2vw] py-[1vw] rounded-[1vw] font-bold text-[1.2vw] relative overflow-hidden shrink-0"
          animate={{
            width: isProcessing ? '12vw' : 'auto',
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
                className="w-[2vw] h-[2vw] border-[0.2vw] border-white border-t-transparent rounded-full"
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
            className="absolute top-0 bottom-0 w-[10vw] bg-gradient-to-r from-transparent via-[rgba(124,58,237,0.3)] to-transparent"
            initial={{ left: '-20%' }}
            animate={{ left: '120%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
        )}
      </motion.div>
    </motion.div>
  );
};
