import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { interpolate } from 'flubber';
import { motion } from 'framer-motion';
import ParticleTrail from '@/components/ParticleTrail';

gsap.registerPlugin(ScrollTrigger);

// Morphability-optimized SVG paths with IDENTICAL topology
// All paths: 12 control points, same command structure (M + 11 L + Z)
// Single closed path, no holes - ensures smooth Flubber interpolation
const MORPH_PATHS = {
  // Wave pattern - energy/motion
  motion: "M20,70 L40,40 L60,70 L80,40 L100,70 L120,40 L140,70 L160,40 L180,70 L180,100 L100,110 L20,100 Z",
  // Horizontal bands - scroll/layers  
  scroll: "M20,25 L180,25 L180,45 L20,45 L20,65 L180,65 L180,85 L20,85 L20,105 L180,105 L180,115 L20,115 Z",
  // T-shape - typography
  type: "M20,25 L180,25 L180,45 L115,45 L115,115 L85,115 L85,45 L20,45 L20,35 L100,30 L180,35 L180,25 Z",
  // Hexagon - depth/dimension
  depth: "M100,15 L160,35 L180,70 L160,105 L100,125 L40,105 L20,70 L40,35 L70,25 L100,20 L130,25 L160,35 Z",
  // Rounded blob - organic craft
  craft: "M60,30 L140,30 L170,50 L180,80 L160,105 L120,115 L80,115 L40,105 L20,80 L30,50 L50,35 L60,30 Z",
};

// Cubic ease-in-out for smooth morph transitions
const easeInOutCubic = (t: number): number => {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

const WORDS = ['motion', 'scroll', 'type', 'depth', 'craft'] as const;
type WordKey = typeof WORDS[number];

interface MorphState {
  currentPath: string;
  currentWord: WordKey;
  progress: number;
}

const MorphingTextSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGPathElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const interpolatorsRef = useRef<Map<string, (t: number) => string>>(new Map());
  
  const [morphState, setMorphState] = useState<MorphState>({
    currentPath: MORPH_PATHS.motion,
    currentWord: 'motion',
    progress: 0,
  });
  
  const [containerSize, setContainerSize] = useState({ width: 512, height: 358 });

  // Pre-compute interpolators for all word pairs (memoized)
  const getInterpolator = useCallback((fromWord: WordKey, toWord: WordKey) => {
    const key = `${fromWord}-${toWord}`;
    if (!interpolatorsRef.current.has(key)) {
      interpolatorsRef.current.set(
        key,
        interpolate(MORPH_PATHS[fromWord], MORPH_PATHS[toWord], { maxSegmentLength: 1 })
      );
    }
    return interpolatorsRef.current.get(key)!;
  }, []);

  // Track container size for particle canvas
  useEffect(() => {
    const container = svgContainerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    // Bail early for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => {
          const progress = self.progress;
          progressRef.current = progress;
          
          // Map progress to word transitions
          // 5 words = 4 transitions, each gets 25% of scroll
          const totalTransitions = WORDS.length - 1;
          const segmentProgress = progress * totalTransitions;
          const currentIndex = Math.min(Math.floor(segmentProgress), totalTransitions - 1);
          const nextIndex = Math.min(currentIndex + 1, WORDS.length - 1);
          const localProgress = segmentProgress - currentIndex;
          
          const fromWord = WORDS[currentIndex];
          const toWord = WORDS[nextIndex];
          
          // Get or create interpolator
          const interp = getInterpolator(fromWord, toWord);
          const clampedProgress = Math.max(0, Math.min(1, localProgress));
          // Apply cubic easing for smooth acceleration/deceleration
          const easedProgress = easeInOutCubic(clampedProgress);
          const newPath = interp(easedProgress);
          
          // Batch DOM update
          if (svgRef.current) {
            svgRef.current.setAttribute('d', newPath);
          }
          
          // Update React state less frequently for display text
          const displayWord = localProgress > 0.5 ? toWord : fromWord;
          setMorphState(prev => {
            // Increased threshold to reduce re-renders while scrolling
            if (prev.currentWord !== displayWord || Math.abs(prev.progress - progress) > 0.02) {
              return { currentPath: newPath, currentWord: displayWord, progress };
            }
            return prev;
          });
        },
      });
    }, section);

    return () => {
      ctx.revert();
      interpolatorsRef.current.clear();
    };
  }, [getInterpolator]);

  return (
    <section 
      ref={sectionRef} 
      className="relative min-h-[300vh]"
      aria-label="Morphing text demonstration"
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        <div className="section-content text-center">
          <span className="text-mono text-xs text-primary tracking-widest uppercase mb-8 block">
            06 — Morphing
          </span>
          
          {/* SVG Morph Container */}
          <div ref={svgContainerRef} className="relative mb-8">
            {/* Particle Trail Canvas */}
            <ParticleTrail
              pathData={morphState.currentPath}
              width={containerSize.width}
              height={containerSize.height}
              viewBox={{ width: 200, height: 140 }}
              particleCount={60}
              scrollProgress={morphState.progress}
            />
            
            <svg 
              viewBox="0 0 200 140" 
              className="w-full max-w-lg mx-auto h-auto relative z-10"
              aria-hidden="true"
            >
              {/* Glow filter */}
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <linearGradient id="morphGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(32, 45%, 65%)" />
                  <stop offset="100%" stopColor="hsl(32, 60%, 55%)" />
                </linearGradient>
              </defs>
              
              {/* Shadow layer */}
              <path
                d={morphState.currentPath}
                fill="hsl(32, 45%, 65%)"
                opacity="0.1"
                transform="translate(4, 4)"
              />
              
              {/* Main morphing path */}
              <path
                ref={svgRef}
                d={morphState.currentPath}
                fill="url(#morphGradient)"
                filter="url(#glow)"
                className="transition-none"
              />
              
              {/* Stroke outline */}
              <path
                d={morphState.currentPath}
                fill="none"
                stroke="hsl(32, 45%, 65%)"
                strokeWidth="0.5"
                opacity="0.5"
              />
            </svg>
          </div>
          
          {/* Current word display */}
          <motion.div
            key={morphState.currentWord}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="mb-6"
          >
            <h2 className="text-display text-display-lg capitalize">
              {morphState.currentWord}
            </h2>
          </motion.div>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {WORDS.map((word, index) => (
              <div
                key={word}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  word === morphState.currentWord
                    ? 'bg-primary scale-125'
                    : 'bg-border'
                }`}
              />
            ))}
          </div>
          
          {/* Description */}
          <p className="text-muted-foreground max-w-md mx-auto text-balance">
            SVG paths interpolate as you scroll, transforming abstract shapes 
            through mathematical resampling. Each form represents a core principle.
          </p>
          
          {/* Scroll hint */}
          <motion.div 
            className="mt-12 text-mono text-xs text-muted-foreground/50"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Keep scrolling to morph
          </motion.div>
        </div>
        
        {/* Background glow */}
        <div 
          className="glow w-[500px] h-[500px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 animate-pulse-glow"
          style={{ opacity: 0.15 + morphState.progress * 0.1 }}
        />
      </div>
    </section>
  );
};

export default MorphingTextSection;
