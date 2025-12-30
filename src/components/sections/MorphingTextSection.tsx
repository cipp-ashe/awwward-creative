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

// Semantic shapes - clean elliptical blobs with clockwise flow
// All share identical 6-segment bezier structure: M C C C C C C Z
// Safe bounds: X(28-172), Y(25-115), centered at (100, 70)
const MORPH_PATHS = {
  // Horizontal stretch - momentum, forward energy
  motion: "M100,28 C135,28 165,45 168,70 C171,95 145,112 100,112 C55,112 32,95 30,70 C28,45 55,30 85,28 C90,27 95,28 100,28 Z",
  // Vertical stretch - upward flow, scrolling rhythm  
  scroll: "M100,25 C120,25 135,42 135,70 C135,98 122,115 100,115 C78,115 65,98 65,70 C65,42 78,27 95,25 C97,25 99,25 100,25 Z",
  // Wide horizontal - text block, stable baseline
  type: "M100,35 C145,35 170,50 170,70 C170,90 145,105 100,105 C55,105 30,90 30,70 C30,50 55,37 90,35 C93,35 97,35 100,35 Z",
  // Slight asymmetry - layered depth, dimension
  depth: "M95,28 C140,30 168,48 170,72 C172,96 148,112 105,113 C62,114 35,98 32,72 C29,46 52,30 88,28 C90,28 93,28 95,28 Z",
  // Near-perfect circle - refined, complete, balanced
  craft: "M100,27 C138,27 168,48 168,72 C168,96 140,113 100,113 C60,113 32,96 32,72 C32,48 60,29 95,27 C97,27 99,27 100,27 Z",
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
