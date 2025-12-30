import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { interpolate } from 'flubber';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

// Pre-optimized SVG paths representing abstract word shapes
// These are simplified geometric interpretations for smooth morphing
const MORPH_PATHS = {
  motion: "M20,50 L40,20 L60,50 L80,20 L100,50 L120,20 L140,50 L160,20 L180,50 Q200,80 180,100 L20,100 Q0,80 20,50 Z",
  scroll: "M30,20 Q100,0 170,20 L170,40 Q100,60 30,40 L30,60 Q100,80 170,60 L170,80 Q100,100 30,80 Z",
  type: "M20,20 L180,20 L180,40 L110,40 L110,100 L90,100 L90,40 L20,40 Z",
  depth: "M100,10 L180,50 L180,90 L100,130 L20,90 L20,50 Z M100,30 L150,60 L150,80 L100,110 L50,80 L50,60 Z",
  craft: "M100,20 Q140,20 160,50 Q180,80 160,100 L40,100 Q20,80 40,50 Q60,20 100,20 M80,50 L120,50 L120,80 L80,80 Z",
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
  const progressRef = useRef(0);
  const interpolatorsRef = useRef<Map<string, (t: number) => string>>(new Map());
  
  const [morphState, setMorphState] = useState<MorphState>({
    currentPath: MORPH_PATHS.motion,
    currentWord: 'motion',
    progress: 0,
  });

  // Pre-compute interpolators for all word pairs (memoized)
  const getInterpolator = useCallback((fromWord: WordKey, toWord: WordKey) => {
    const key = `${fromWord}-${toWord}`;
    if (!interpolatorsRef.current.has(key)) {
      interpolatorsRef.current.set(
        key,
        interpolate(MORPH_PATHS[fromWord], MORPH_PATHS[toWord], { maxSegmentLength: 5 })
      );
    }
    return interpolatorsRef.current.get(key)!;
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
          const newPath = interp(clampedProgress);
          
          // Batch DOM update
          if (svgRef.current) {
            svgRef.current.setAttribute('d', newPath);
          }
          
          // Update React state less frequently for display text
          const displayWord = localProgress > 0.5 ? toWord : fromWord;
          setMorphState(prev => {
            if (prev.currentWord !== displayWord || Math.abs(prev.progress - progress) > 0.01) {
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
          <div className="relative mb-8">
            <svg 
              viewBox="0 0 200 140" 
              className="w-full max-w-lg mx-auto h-auto"
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
