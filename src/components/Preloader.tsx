/**
 * Preloader Component
 * 
 * Full-screen loading overlay shown during initial asset loading.
 * Displays an animated logo, progress bar, and asset loading status.
 * 
 * The preloader:
 * 1. Tracks font and critical asset loading via useAssetLoader
 * 2. Shows progress with animated SVG and progress bar
 * 3. Calls onComplete when ready, triggering section reveals
 * 
 * @example
 * <Preloader 
 *   onComplete={() => setIsLoading(false)} 
 *   minDuration={2500} 
 * />
 */

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useAssetLoader from '@/hooks/useAssetLoader';
import { DURATION, EASING_ARRAY } from '@/constants/animation';

export interface PreloaderProps {
  /** Callback fired when loading completes and exit animation finishes */
  onComplete: () => void;
  /** Minimum time to show preloader in ms (default: 1500) */
  minDuration?: number;
}

const Preloader = ({ onComplete, minDuration = 1500 }: PreloaderProps) => {
  const [isExiting, setIsExiting] = useState(false);
  const { progress, isComplete, currentAsset, loadedAssets, totalAssets } = useAssetLoader({
    minDuration,
    maxTimeout: 8000,
  });

  const handleComplete = useCallback(() => {
    setIsExiting(true);
    setTimeout(onComplete, 800);
  }, [onComplete]);

  // Trigger completion when assets are loaded
  useEffect(() => {
    if (isComplete && !isExiting) {
      handleComplete();
    }
  }, [isComplete, isExiting, handleComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          className="fixed inset-0 z-[10001] bg-background flex flex-col items-center justify-center"
          initial={{ opacity: 1 }}
          exit={{ 
            opacity: 0,
            transition: { duration: DURATION.normal, ease: EASING_ARRAY.smooth }
          }}
        >
          {/* Animated logo */}
          <motion.div
            className="relative mb-12"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: DURATION.normal, ease: EASING_ARRAY.smooth }}
          >
            <svg
              width="80"
              height="80"
              viewBox="0 0 80 80"
              fill="none"
              className="overflow-visible"
            >
              {/* Shimmer gradient definition */}
              <defs>
                <linearGradient id="shimmerGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                  <stop offset="40%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                  <stop offset="50%" stopColor="hsl(var(--primary-foreground))" stopOpacity="0.8" />
                  <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                  <animate
                    attributeName="x1"
                    values="-100%;100%"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="x2"
                    values="0%;200%"
                    dur="1.5s"
                    repeatCount="indefinite"
                  />
                </linearGradient>
              </defs>

              {/* Outer ring */}
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
                  pathLength: { duration: DURATION.xslow, ease: EASING_ARRAY.smooth },
                  rotate: { duration: DURATION.xslow, ease: EASING_ARRAY.smooth }
                }}
                style={{ transformOrigin: 'center' }}
              />
              
              {/* Progress ring with shimmer - only shimmer while loading */}
              <motion.circle
                cx="40"
                cy="40"
                r="35"
                stroke={isComplete ? "hsl(var(--primary))" : "url(#shimmerGradient)"}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: progress / 100 }}
                transition={{ duration: DURATION.fast, ease: 'easeOut' }}
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
                  pathLength: { duration: DURATION.slow, delay: DURATION.fast, ease: EASING_ARRAY.smooth },
                  opacity: { duration: DURATION.fast, delay: DURATION.fast }
                }}
              />
              
              {/* Center dot - pulses when loading */}
              <motion.circle
                cx="40"
                cy="40"
                r="4"
                fill="hsl(var(--primary))"
                initial={{ scale: 0 }}
                animate={{ 
                  scale: isComplete ? 1 : [0.8, 1.2, 0.8],
                }}
                transition={isComplete 
                  ? { duration: DURATION.fast, ease: EASING_ARRAY.bounce }
                  : { duration: DURATION.word, repeat: Infinity, ease: 'easeInOut' }
                }
              />
            </svg>
            
            {/* Glow effect */}
            <motion.div
              className="absolute inset-0 -z-10 blur-2xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              transition={{ delay: DURATION.medium, duration: DURATION.reveal }}
              style={{
                background: 'radial-gradient(circle, hsl(var(--primary) / 0.3) 0%, transparent 70%)',
                transform: 'scale(2)'
              }}
            />
          </motion.div>

          {/* Progress bar */}
          <div className="w-48 relative">
            <div className="h-px bg-border w-full" />
            <motion.div
              className="absolute top-0 left-0 h-px bg-primary origin-left"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: progress / 100 }}
              transition={{ duration: DURATION.fast, ease: 'easeOut' }}
            />
            
            {/* Progress percentage */}
            <motion.div
              className="mt-4 text-mono text-xs text-muted-foreground text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: DURATION.fast }}
            >
              <span className="text-primary">{Math.round(progress)}</span>
              <span className="ml-1">%</span>
            </motion.div>
          </div>

          {/* Current asset being loaded */}
          <motion.p
            className="mt-6 text-mono text-[10px] text-muted-foreground/60 tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: DURATION.fast }}
          >
            {currentAsset}
          </motion.p>

          {/* Asset count */}
          {totalAssets > 0 && (
            <motion.p
              className="mt-2 text-mono text-[10px] text-muted-foreground/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: DURATION.medium }}
            >
              {loadedAssets} / {totalAssets} assets
            </motion.p>
          )}

          {/* Loading text */}
          <motion.p
            className="absolute bottom-12 text-mono text-xs text-muted-foreground tracking-widest uppercase"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: DURATION.medium, duration: DURATION.normal }}
          >
            {isComplete ? 'Ready' : 'Loading Experience'}
          </motion.p>

          {/* Corner decorations */}
          <motion.div
            className="absolute top-8 left-8 w-8 h-8 border-l border-t border-border"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: DURATION.normal }}
          />
          <motion.div
            className="absolute top-8 right-8 w-8 h-8 border-r border-t border-border"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: DURATION.fast, duration: DURATION.normal }}
          />
          <motion.div
            className="absolute bottom-8 left-8 w-8 h-8 border-l border-b border-border"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: DURATION.fast, duration: DURATION.normal }}
          />
          <motion.div
            className="absolute bottom-8 right-8 w-8 h-8 border-r border-b border-border"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: DURATION.medium, duration: DURATION.normal }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Preloader;
