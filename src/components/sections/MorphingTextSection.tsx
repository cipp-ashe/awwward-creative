/**
 * MorphingTextSection
 * 
 * SVG path morphing demonstration using Flubber interpolation.
 * Uses sticky scroll layout - not wrapped with Section component.
 * 
 * Scroll progress is damped for smooth particle trail and glow updates.
 * SVG morphing uses direct DOM manipulation with cubic easing for performance.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';
import { interpolate } from 'flubber';
import { motion } from 'framer-motion';
import ParticleTrail from '@/components/ParticleTrail';
import { SectionContent, SectionLabel } from '@/components/layout/Section';
import { ANIMATION, TRANSITION, EASING_FN, SMOOTHING, DURATION } from '@/constants/animation';
import { useSmoothValue } from '@/hooks/useSmoothValue';
import { useMotionConfigSafe } from '@/contexts/MotionConfigContext';

// Semantic shapes - organic forms that subtly embody each word
// All share identical 6-segment bezier structure: M C C C C C C Z
// Centered at ~(100, 70) with similar scale for smooth morphing
const MORPH_PATHS = {
  // Dynamic, forward-leaning - suggests momentum
  motion: "M55,65 C45,40 70,20 105,22 C140,24 170,45 175,72 C180,99 155,125 115,128 C75,131 50,115 40,88 C30,61 65,90 55,65 Z",
  // Tall, vertical rhythm - suggests upward flow
  scroll: "M90,18 C115,15 135,32 145,55 C155,78 150,105 135,125 C120,145 95,148 75,132 C55,116 50,88 55,60 C60,32 65,21 90,18 Z",
  // Wide, stable baseline - suggests text block
  type: "M40,62 C38,40 65,28 100,25 C135,22 165,35 172,58 C179,81 168,108 135,118 C102,128 60,122 42,100 C24,78 42,84 40,62 Z",
  // Layered, asymmetric weight - suggests dimension
  depth: "M85,22 C125,18 160,38 175,68 C190,98 170,128 130,135 C90,142 55,128 38,98 C21,68 35,35 65,25 C95,15 45,26 85,22 Z",
  // Balanced, refined circle - suggests completion
  craft: "M95,20 C135,18 168,42 178,72 C188,102 168,132 132,140 C96,148 58,132 42,100 C26,68 42,35 72,22 C102,9 55,22 95,20 Z",
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
  const shadowPathRef = useRef<SVGPathElement>(null);
  const glowPathRef = useRef<SVGPathElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const echoProgressRef = useRef(0); // Lagged progress for outline echo effect
  const interpolatorsRef = useRef<Map<string, (t: number) => string>>(new Map());
  
  // Raw scroll progress from ScrollTrigger
  const [rawProgress, setRawProgress] = useState(0);
  
  const [morphState, setMorphState] = useState<MorphState>({
    currentPath: MORPH_PATHS.motion,
    currentWord: 'motion',
    progress: 0,
  });
  
  const [containerSize, setContainerSize] = useState({ width: 512, height: 358 });
  
  const { isReducedMotion } = useMotionConfigSafe();
  
  // Damping layer: smooth scroll progress for particles and visual effects
  // SMOOTHING.scroll for cinematic scroll-driven animations
  const smoothProgress = useSmoothValue(rawProgress, {
    smoothing: SMOOTHING.scroll,
    threshold: 0.0001
  });

  // Pre-compute interpolators for all word pairs
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
    // Use centralized motion config instead of local check
    if (isReducedMotion) {
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
          
          // Update raw progress for damping layer
          setRawProgress(progress);
          
          const totalTransitions = WORDS.length - 1;
          const segmentProgress = progress * totalTransitions;
          const currentIndex = Math.min(Math.floor(segmentProgress), totalTransitions - 1);
          const nextIndex = Math.min(currentIndex + 1, WORDS.length - 1);
          const localProgress = segmentProgress - currentIndex;
          
          const fromWord = WORDS[currentIndex];
          const toWord = WORDS[nextIndex];
          
          const interp = getInterpolator(fromWord, toWord);
          const clampedProgress = Math.max(0, Math.min(1, localProgress));
          const easedProgress = EASING_FN.easeInOutCubic(clampedProgress);
          const newPath = interp(easedProgress);
          
          // Direct DOM update for main fill and shadow (in sync)
          if (svgRef.current) {
            svgRef.current.setAttribute('d', newPath);
          }
          if (shadowPathRef.current) {
            shadowPathRef.current.setAttribute('d', newPath);
          }
          
          // Glow trail: softer echo that lags behind for intentional "bloom" aesthetic
          // Slower smoothing (0.08) creates ~15% visible lag - clearly intentional
          const echoSmoothing = 0.08;
          echoProgressRef.current += (progress - echoProgressRef.current) * echoSmoothing;
          
          // Calculate lagged morph for glow trail
          const echoSegmentProgress = echoProgressRef.current * totalTransitions;
          const echoCurrentIndex = Math.min(Math.floor(echoSegmentProgress), totalTransitions - 1);
          const echoNextIndex = Math.min(echoCurrentIndex + 1, WORDS.length - 1);
          const echoLocalProgress = echoSegmentProgress - echoCurrentIndex;
          
          const echoFromWord = WORDS[echoCurrentIndex];
          const echoToWord = WORDS[echoNextIndex];
          const echoInterp = getInterpolator(echoFromWord, echoToWord);
          const echoClampedProgress = Math.max(0, Math.min(1, echoLocalProgress));
          const echoEasedProgress = EASING_FN.easeInOutCubic(echoClampedProgress);
          const echoPath = echoInterp(echoEasedProgress);
          
          if (glowPathRef.current) {
            glowPathRef.current.setAttribute('d', echoPath);
          }
          
          // Update display word (less frequent, with threshold)
          const displayWord = localProgress > 0.5 ? toWord : fromWord;
          setMorphState(prev => {
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
  }, [getInterpolator, isReducedMotion]);

  return (
    <section 
      ref={sectionRef}
      id="morphing"
      className="relative min-h-[300vh]"
      aria-label="Morphing text demonstration"
    >
      {/* Sticky container */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-center overflow-hidden">
        <SectionContent className="text-center">
          <SectionLabel className="mb-8 block">06 — Morphing</SectionLabel>
          
          {/* SVG Morph Container */}
          <div ref={svgContainerRef} className="relative mb-8">
            {/* Use smoothed progress for particle trail */}
            <ParticleTrail
              pathData={morphState.currentPath}
              width={containerSize.width}
              height={containerSize.height}
              viewBox={{ width: 200, height: 140 }}
              particleCount={60}
              scrollProgress={smoothProgress}
            />
            
            <svg 
              viewBox="0 0 200 140" 
              className="w-full max-w-lg mx-auto h-auto relative z-10"
              aria-hidden="true"
            >
              <defs>
                {/* Main shape glow */}
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                {/* Soft echo glow trail - larger blur, faded */}
                <filter id="echoGlow" x="-100%" y="-100%" width="300%" height="300%">
                  <feGaussianBlur stdDeviation="6" result="blur"/>
                  <feColorMatrix 
                    type="matrix" 
                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.35 0"
                    in="blur"
                    result="fadedBlur"
                  />
                </filter>
                <linearGradient id="morphGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(32, 45%, 65%)" />
                  <stop offset="100%" stopColor="hsl(32, 60%, 55%)" />
                </linearGradient>
              </defs>
              
              {/* Glow trail - lagged echo with soft blur */}
              <path
                ref={glowPathRef}
                d={MORPH_PATHS.motion}
                fill="hsl(32, 45%, 65%)"
                filter="url(#echoGlow)"
              />
              
              {/* Shadow offset */}
              <path
                ref={shadowPathRef}
                d={MORPH_PATHS.motion}
                fill="hsl(32, 45%, 65%)"
                opacity="0.08"
                transform="translate(3, 3)"
              />
              
              {/* Main morphing shape */}
              <path
                ref={svgRef}
                d={MORPH_PATHS.motion}
                fill="url(#morphGradient)"
                filter="url(#glow)"
                className="transition-none"
              />
            </svg>
          </div>
          
          {/* Current word display */}
          <motion.div
            key={morphState.currentWord}
            {...ANIMATION.fadeUp}
            exit={{ opacity: 0, y: -20 }}
            transition={TRANSITION.fast}
            className="mb-6"
          >
            <h2 className="text-display text-display-lg capitalize">
              {morphState.currentWord}
            </h2>
          </motion.div>
          
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {WORDS.map((word) => (
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
          
          <p className="text-muted-foreground max-w-md mx-auto text-balance">
            SVG paths interpolate as you scroll, transforming abstract shapes 
            through mathematical resampling. Each form represents a core principle.
          </p>
          
          <motion.div 
            className="mt-12 text-mono text-xs text-muted-foreground/50"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: DURATION.pulse * 1.5, repeat: Infinity }}
          >
            Keep scrolling to morph
          </motion.div>
        </SectionContent>
        
        {/* Use smoothed progress for glow intensity */}
        <div 
          className="glow w-[500px] h-[500px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 animate-pulse-glow"
          style={{ opacity: 0.15 + smoothProgress * 0.1 }}
        />
      </div>
    </section>
  );
};

export default MorphingTextSection;
