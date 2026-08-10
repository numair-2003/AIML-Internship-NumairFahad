import { useVideoPlayer } from '@/lib/video';
import { AnimatePresence, motion } from 'framer-motion';
import { Scene0 } from './video_scenes/Scene0';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';

const SCENE_DURATIONS = {
  scene0: 8000,
  scene1: 8000,
  scene2: 12000,
  scene3: 16000,
  scene4: 10000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-bg-dark)' }}
    >
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        {/* Animated Gradient Orbs */}
        <motion.div
          className="absolute rounded-full blur-[120px] opacity-30"
          style={{ background: 'var(--color-primary)' }}
          animate={{
            width: currentScene === 0 ? '40vw' : currentScene === 4 ? '60vw' : '30vw',
            height: currentScene === 0 ? '40vw' : currentScene === 4 ? '60vw' : '30vw',
            top: currentScene === 1 ? '10%' : currentScene === 3 ? '60%' : '50%',
            left: currentScene === 1 ? '70%' : currentScene === 2 ? '10%' : '50%',
            x: '-50%',
            y: '-50%',
          }}
          transition={{ duration: 3, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full blur-[150px] opacity-20"
          style={{ background: 'var(--color-secondary)' }}
          animate={{
            width: currentScene === 2 ? '50vw' : '35vw',
            height: currentScene === 2 ? '50vw' : '35vw',
            bottom: currentScene === 2 ? '10%' : currentScene === 4 ? '50%' : '20%',
            right: currentScene === 1 ? '80%' : currentScene === 3 ? '10%' : '20%',
            x: '50%',
            y: '50%',
          }}
          transition={{ duration: 4, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute rounded-full blur-[100px] opacity-20"
          style={{ background: 'var(--color-accent)' }}
          animate={{
            width: currentScene === 3 ? '40vw' : '20vw',
            height: currentScene === 3 ? '40vw' : '20vw',
            top: currentScene === 3 ? '20%' : currentScene === 0 ? '20%' : '80%',
            left: currentScene === 3 ? '80%' : currentScene === 0 ? '20%' : '80%',
            x: '-50%',
            y: '-50%',
          }}
          transition={{ duration: 3.5, ease: 'easeInOut' }}
        />
        
        {/* Noise overlay */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />
      </div>

      <AnimatePresence mode="popLayout">
        {currentScene === 0 && <Scene0 key="scene0" />}
        {currentScene === 1 && <Scene1 key="scene1" />}
        {currentScene === 2 && <Scene2 key="scene2" />}
        {currentScene === 3 && <Scene3 key="scene3" />}
        {currentScene === 4 && <Scene4 key="scene4" />}
      </AnimatePresence>
    </div>
  );
}
