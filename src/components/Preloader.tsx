import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PreloaderProps {
  onComplete: () => void;
  minDuration?: number;
}

const Preloader = ({ onComplete, minDuration = 2000 }: PreloaderProps) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  const handleComplete = useCallback(() => {
    setIsExiting(true);
    // Allow exit animation to complete before calling onComplete
    setTimeout(onComplete, 800);
  }, [onComplete]);

  useEffect(() => {
    const startTime = Date.now();
    let animationFrame: number;
    
    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / minDuration, 1);
      
      // Eased progress for smoother feel
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
      setProgress(easedProgress * 100);
      
      if (rawProgress < 1) {
        animationFrame = requestAnimationFrame(updateProgress);
      } else {
        handleComplete();
      }
    };
    
    animationFrame = requestAnimationFrame(updateProgress);
    
    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [minDuration, handleComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="fixed inset-0 z-[10001] bg-background flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] }
          }}
        >
          {/* Animated logo */}
          <motion.div
            className="relative mb-12"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Logo mark - geometric abstract shape */}
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              className="overflow-visible"
            >
              {/* Outer rotating ring */}
              <motion.circle
                cx="40"
                cy="40"
                r="35"
                stroke="hsl(var(--border))"
                strokeWidth="1"
                fill="none"
                initial={{ pathLength: 0, rotate: -90 }}
                animate={{ pathLength: 1, rotate: 270 }}
                transition={{ 
                  pathLength: { duration: 1.8, ease: [0.16, 1, 0.3, 1] },
                  rotate: { duration: 1.8, ease: [0.16, 1, 0.3, 1] }
                }}
                style={{ transformOrigin: 'center' }}
              />
              
              {/* Primary accent ring */}
              <motion.circle
                cx="40"
                cy="40"
                r="35"
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress / 100 }}
                transition={{ duration: 0.1 }}
                style={{ 
                  transformOrigin: 'center',
                  rotate: '-90deg'
                }}
              />
              
              {/* Inner geometric shape */}
              <motion.path
                d="M40 20 L55 35 L55 55 L40 70 L25 55 L25 35 Z"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                fill="none"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ 
                  pathLength: { duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] },
                  opacity: { duration: 0.3, delay: 0.3 }
                }}
              />
              
              {/* Center dot */}
              <motion.circle
                cx="40"
                cy="40"
                r="4"
                fill="hsl(var(--primary))"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </svg>
            
            {/* Glow effect behind logo */}
            <motion.div
              className="absolute inset-0 -z-10 blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
                transform: 'scale(2)'
              }}
            />
          </motion.div>

          {/* Progress bar container */}
          <div className="w-48 relative">
            {/* Background track */}
            <div className="h-px bg-border w-full" />
            
            {/* Progress fill */}
            <motion.div
              className="absolute top-0 left-0 h-px bg-primary origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress / 100 }}
              transition={{ duration: 0.1 }}
            />
            
            {/* Progress text */}
            <motion.div
              className="mt-4 text-mono text-xs text-muted-foreground text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-primary">{Math.round(progress)}</span>
              <span className="ml-1">%</span>
            </motion.div>
          </div>

          {/* Loading text */}
          <motion.p
            className="absolute bottom-12 text-mono text-xs text-muted-foreground tracking-widest uppercase"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            Loading Experience
          </motion.p>

          {/* Corner decorations */}
          <motion.div
            className="absolute top-8 left-8 w-8 h-8 border-l border-t border-border"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          />
          <motion.div
            className="absolute top-8 right-8 w-8 h-8 border-r border-t border-border"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />
          <motion.div
            className="absolute bottom-8 left-8 w-8 h-8 border-l border-b border-border"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          />
          <motion.div
            className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-border"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
