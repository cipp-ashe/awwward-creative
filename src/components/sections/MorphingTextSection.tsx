/**
 * MorphingTextSection
 *
 * SVG path morphing demonstration using Flubber interpolation.
 * Uses sticky scroll layout - not wrapped with Section component.
 *
 * Scroll progress is damped for smooth particle trail and glow updates.
 * SVG morphing uses direct DOM manipulation with cubic easing for performance.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { interpolateString } from "d3-interpolate";
import { motion } from "framer-motion";
import ParticleTrail from "@/components/ParticleTrail";
import { SectionContent, SectionLabel } from "@/components/layout/Section";
import { ANIMATION, TRANSITION, EASING_FN, SMOOTHING, DURATION } from "@/constants/animation";
import { useSmoothValue } from "@/hooks/useSmoothValue";
import { useMotionConfigSafe } from "@/contexts/MotionConfigContext";

// Morphability-optimized SVG paths with IDENTICAL topology
const MORPH_PATHS = {
  // Fixed: A unified "fast forward" structure.
  // No long return jump. The end point folds naturally into the start.
  motion: "M20,20 L100,20 L120,40 L160,40 L180,60 L160,80 L120,80 L100,100 L20,100 L50,80 L50,40 L20,20 Z",
  scroll: "M60,20 L140,20 L140,40 L60,40 L60,50 L140,50 L140,70 L60,70 L60,80 L140,80 L140,100 L60,100 Z",
  type: "M40,20 L80,20 L80,40 L100,40 L100,20 L160,20 L160,100 L100,100 L100,80 L80,80 L80,100 L40,100 Z",
  depth: "M100,20 L160,40 L160,80 L100,100 L40,80 L40,40 L60,45 L100,35 L140,45 L140,75 L100,85 L60,75 Z",
  craft: "M20,20 L60,20 L60,40 L140,40 L140,20 L180,20 L180,60 L160,60 L160,100 L40,100 L40,60 L20,60 Z",
};

const WORDS = ["motion", "scroll", "type", "depth", "craft"] as const;
type WordKey = (typeof WORDS)[number];

interface MorphState {
  currentPath: string;
  currentWord: WordKey;
  progress: number;
}

const MorphingTextSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGPathElement>(null);
  const shadowPathRef = useRef<SVGPathElement>(null);
  const outlinePathRef = useRef<SVGPathElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const echoProgressRef = useRef(0); // Lagged progress for outline echo effect
  const interpolatorsRef = useRef<Map<string, (t: number) => string>>(new Map());

  // Raw scroll progress from ScrollTrigger
  const [rawProgress, setRawProgress] = useState(0);

  const [morphState, setMorphState] = useState<MorphState>({
    currentPath: MORPH_PATHS.motion,
    currentWord: "motion",
    progress: 0,
  });

  const [containerSize, setContainerSize] = useState({ width: 512, height: 358 });

  const { isReducedMotion } = useMotionConfigSafe();

  // Damping layer: smooth scroll progress for particles and visual effects
  // SMOOTHING.scroll for cinematic scroll-driven animations
  const smoothProgress = useSmoothValue(rawProgress, {
    smoothing: SMOOTHING.scroll,
    threshold: 0.0001,
  });

  // Pre-compute interpolators for all word pairs
  const getInterpolator = useCallback((fromWord: WordKey, toWord: WordKey) => {
    const key = `${fromWord}-${toWord}`;
    if (!interpolatorsRef.current.has(key)) {
      interpolatorsRef.current.set(
        key,
        interpolateString(MORPH_PATHS[fromWord], MORPH_PATHS[toWord]),
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
        start: "top top",
        end: "bottom bottom",
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
            svgRef.current.setAttribute("d", newPath);
          }
          if (shadowPathRef.current) {
            shadowPathRef.current.setAttribute("d", newPath);
          }

          // Echo effect: outline trails slightly behind for intentional "ghost" aesthetic
          // Smooth interpolation toward current progress (creates ~5% lag)
          const echoSmoothing = 0.15;
          echoProgressRef.current += (progress - echoProgressRef.current) * echoSmoothing;

          // Calculate lagged morph for outline
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

          if (outlinePathRef.current) {
            outlinePathRef.current.setAttribute("d", echoPath);
          }

          // Update display word (less frequent, with threshold)
          const displayWord = localProgress > 0.5 ? toWord : fromWord;
          setMorphState((prev) => {
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
    <section ref={sectionRef} id="morphing" className="relative min-h-[300vh]" aria-label="Morphing text demonstration">
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

            <svg viewBox="0 0 200 140" className="w-full max-w-lg mx-auto h-auto relative z-10" aria-hidden="true">
              <defs>
                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="morphGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(32, 45%, 65%)" />
                  <stop offset="100%" stopColor="hsl(32, 60%, 55%)" />
                </linearGradient>
              </defs>

              <path
                ref={shadowPathRef}
                d={MORPH_PATHS.motion}
                fill="hsl(32, 45%, 65%)"
                opacity="0.1"
                transform="translate(4, 4)"
              />

              <path
                ref={svgRef}
                d={MORPH_PATHS.motion}
                fill="url(#morphGradient)"
                filter="url(#glow)"
                className="transition-none"
              />

              <path
                ref={outlinePathRef}
                d={MORPH_PATHS.motion}
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
            {...ANIMATION.fadeUp}
            exit={{ opacity: 0, y: -20 }}
            transition={TRANSITION.fast}
            className="mb-6"
          >
            <h2 className="text-display text-display-lg capitalize">{morphState.currentWord}</h2>
          </motion.div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
            {WORDS.map((word) => (
              <div
                key={word}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  word === morphState.currentWord ? "bg-primary scale-125" : "bg-border"
                }`}
              />
            ))}
          </div>

          <p className="text-muted-foreground max-w-md mx-auto text-balance">
            SVG paths interpolate as you scroll, transforming abstract shapes through mathematical resampling. Each form
            represents a core principle.
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
