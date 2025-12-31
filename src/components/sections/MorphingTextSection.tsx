/**
 * MorphingTextSection
 *
 * SVG path morphing with three critical architectural fixes:
 * 1. Ghost Wiring Fix: Parent container rotates BOTH SVG and ParticleTrail
 * 2. Layout Thrashing Fix: Fixed-height text container prevents CLS
 * 3. Main-Thread Choke Fix: Direct DOM manipulation bypasses React render cycle
 *
 * Uses d3-interpolate for matched-topology path interpolation.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { interpolateString } from "d3-interpolate";
import { motion, AnimatePresence } from "framer-motion";
import ParticleTrail from "@/components/ParticleTrail";
import { SectionContent, SectionLabel } from "@/components/layout/Section";
import { TRANSITION, EASING_FN, DURATION, SMOOTHING } from "@/constants/animation";
import { useMotionConfigSafe } from "@/contexts/MotionConfigContext";

// 12-point topology invariant paths for artifact-free interpolation
const MORPH_PATHS = {
  motion: "M20,20 L100,20 L120,40 L160,40 L180,60 L160,80 L120,80 L100,100 L20,100 L50,80 L50,40 L20,20 Z",
  scroll: "M40,25 L160,25 L160,35 L40,35 L40,55 L160,55 L160,65 L40,65 L40,85 L160,85 L160,95 L40,95 Z",
  type: "M40,20 L80,20 L80,40 L100,40 L100,20 L160,20 L160,100 L100,100 L100,80 L80,80 L80,100 L40,100 Z",
  depth: "M100,20 L160,40 L160,80 L100,100 L40,80 L40,40 L60,45 L100,35 L140,45 L140,75 L100,85 L60,75 Z",
  craft: "M20,20 L60,20 L60,40 L140,40 L140,20 L180,20 L180,60 L160,60 L160,100 L40,100 L40,60 L20,60 Z",
};

// Semantic mapping: shape embodies the principle
const PRINCIPLES = {
  motion: {
    label: "Momentum",
    desc: "Forward velocity with aerodynamic intent. Design should feel like it has mass and trajectory.",
  },
  scroll: {
    label: "Continuity",
    desc: "The timeline of interaction. Information flows in a structured track, preserving context.",
  },
  type: {
    label: "Syntax",
    desc: "The terminal cursor and the bracket. Typography is the interface between logic and legibility.",
  },
  depth: {
    label: "Hierarchy",
    desc: "Isometric layering. Systems have substrate, logic, and presentation. We design for the Z-index.",
  },
  craft: {
    label: "Precision",
    desc: "The reticle and the frame. Pixel-perfect alignment is visible evidence of structural integrity.",
  },
};

const WORDS = ["motion", "scroll", "type", "depth", "craft"] as const;
type WordKey = (typeof WORDS)[number];

// Color interpolation: Champagne -> Rose -> Amber (outside component to avoid reallocation)
const getGradientColor = (progress: number): string => {
  if (progress < 0.5) {
    const t = progress * 2;
    // Champagne: hsl(40, 50%, 75%) -> Rose: hsl(350, 60%, 70%)
    const h = 40 + (-10 - 40) * t; // 350 as -10 for smooth wrap
    const s = 50 + (60 - 50) * t;
    const l = 75 + (70 - 75) * t;
    return `hsl(${h < 0 ? 360 + h : h}, ${s}%, ${l}%)`;
  } else {
    const t = (progress - 0.5) * 2;
    // Rose: hsl(350, 60%, 70%) -> Amber: hsl(35, 80%, 60%)
    const h = -10 + (35 - -10) * t;
    const s = 60 + (80 - 60) * t;
    const l = 70 + (60 - 70) * t;
    return `hsl(${h < 0 ? 360 + h : h}, ${s}%, ${l}%)`;
  }
};

const MorphingTextSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  // Refs for Direct DOM Manipulation (bypasses React render cycle)
  const svgPathRef = useRef<SVGPathElement>(null);
  const shadowPathRef = useRef<SVGPathElement>(null);
  const outlinePathRef = useRef<SVGPathElement>(null);
  const containerRotateRef = useRef<HTMLDivElement>(null); // FIX A: Rotates BOTH particles and SVG
  const gradientStop1Ref = useRef<SVGStopElement>(null); // FIX C: Direct gradient update
  const gradientStop2Ref = useRef<SVGStopElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Logic refs (bypass React render cycle for high-frequency updates)
  const interpolatorsRef = useRef<Map<string, (t: number) => string>>(new Map());
  const echoProgressRef = useRef(0);
  const pathDataRef = useRef<string>(MORPH_PATHS.motion); // FIX: Ref-based path for ParticleTrail
  const smoothTiltRef = useRef(0); // FIX: Damped rotation to prevent jitter
  const rawProgressRef = useRef(0); // FIX: Ref-based progress for damping input
  const smoothedProgressRef = useRef(0); // FIX: Temporal decoupling from scroll velocity

  // React state for SEMANTIC updates only (text content)
  const [currentWord, setCurrentWord] = useState<WordKey>("motion");
  const [containerSize, setContainerSize] = useState({ width: 512, height: 358 });

  const { isReducedMotion } = useMotionConfigSafe();

  // Memoized interpolator factory
  const getInterpolator = useCallback((fromWord: WordKey, toWord: WordKey) => {
    const key = `${fromWord}-${toWord}`;
    if (!interpolatorsRef.current.has(key)) {
      interpolatorsRef.current.set(
        key,
        interpolateString(MORPH_PATHS[fromWord], MORPH_PATHS[toWord])
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

  // Main scroll-driven animation
  useEffect(() => {
    if (isReducedMotion) return;

    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: true,  // Instant - Lenis already provides smooth scroll input
        invalidateOnRefresh: true, // Recalculate on resize
        onRefresh: (self) => {
          // Resync all refs on layout refresh to prevent "replay" effect
          const progress = self.progress;
          smoothedProgressRef.current = progress;
          rawProgressRef.current = progress;
          echoProgressRef.current = progress;
        },
        onLeaveBack: () => {
          // Snap to initial state when scrolling above section
          smoothedProgressRef.current = 0;
          rawProgressRef.current = 0;
          echoProgressRef.current = 0;
          
          const initialPath = MORPH_PATHS.motion;
          pathDataRef.current = initialPath;
          
          if (svgPathRef.current) svgPathRef.current.setAttribute("d", initialPath);
          if (shadowPathRef.current) shadowPathRef.current.setAttribute("d", initialPath);
          if (outlinePathRef.current) outlinePathRef.current.setAttribute("d", initialPath);
          
          if (gradientStop1Ref.current) gradientStop1Ref.current.setAttribute("stop-color", "hsl(40, 50%, 75%)");
          if (gradientStop2Ref.current) gradientStop2Ref.current.setAttribute("stop-color", "hsl(35, 60%, 65%)");
          
          if (containerRotateRef.current) gsap.set(containerRotateRef.current, { scale: 1 });
          
          setCurrentWord("motion");
        },
        onLeave: () => {
          // Snap to final state when scrolling past section
          smoothedProgressRef.current = 1;
          rawProgressRef.current = 1;
          echoProgressRef.current = 1;
          
          const finalPath = MORPH_PATHS.craft;
          pathDataRef.current = finalPath;
          
          if (svgPathRef.current) svgPathRef.current.setAttribute("d", finalPath);
          if (shadowPathRef.current) shadowPathRef.current.setAttribute("d", finalPath);
          if (outlinePathRef.current) outlinePathRef.current.setAttribute("d", finalPath);
          
          const finalColor = getGradientColor(1);
          if (gradientStop1Ref.current) gradientStop1Ref.current.setAttribute("stop-color", finalColor);
          if (gradientStop2Ref.current) gradientStop2Ref.current.setAttribute("stop-color", finalColor);
          
          if (containerRotateRef.current) gsap.set(containerRotateRef.current, { scale: 1 });
          
          setCurrentWord("craft");
        },
        onUpdate: (self) => {
          // Direct mapping - Lenis already provides smooth scroll input
          // Removing redundant smoothing layer to eliminate triple-smoothing lag
          const progress = self.progress;

          // Update refs for downstream consumers (no React re-render)
          smoothedProgressRef.current = progress;
          rawProgressRef.current = progress;

          // --- 1. MORPH LOGIC ---
          const totalTransitions = WORDS.length - 1;
          const segmentProgress = progress * totalTransitions;
          const currentIndex = Math.min(Math.floor(segmentProgress), totalTransitions - 1);
          const nextIndex = Math.min(currentIndex + 1, WORDS.length - 1);
          const localProgress = segmentProgress - currentIndex;

          const fromWord = WORDS[currentIndex];
          const toWord = WORDS[nextIndex];

          const interp = getInterpolator(fromWord, toWord);
          const easedProgress = EASING_FN.easeInOutQuint(Math.max(0, Math.min(1, localProgress)));
          const newPath = interp(easedProgress);

          // Direct DOM update (fast - bypasses React)
          if (svgPathRef.current) svgPathRef.current.setAttribute("d", newPath);
          if (shadowPathRef.current) shadowPathRef.current.setAttribute("d", newPath);
          
          // Update path ref for ParticleTrail (no React re-render)
          pathDataRef.current = newPath;

          // Echo effect: outline trails behind
          const echoSmoothing = 0.15;
          echoProgressRef.current += (progress - echoProgressRef.current) * echoSmoothing;

          const echoSegmentProgress = echoProgressRef.current * totalTransitions;
          const echoCurrentIndex = Math.min(Math.floor(echoSegmentProgress), totalTransitions - 1);
          const echoNextIndex = Math.min(echoCurrentIndex + 1, WORDS.length - 1);
          const echoLocalProgress = echoSegmentProgress - echoCurrentIndex;

          const echoInterp = getInterpolator(WORDS[echoCurrentIndex], WORDS[echoNextIndex]);
          const echoEasedProgress = EASING_FN.easeInOutQuint(Math.max(0, Math.min(1, echoLocalProgress)));
          const echoPath = echoInterp(echoEasedProgress);

          if (outlinePathRef.current) outlinePathRef.current.setAttribute("d", echoPath);

          // --- 2. PLATEAU PULSE (subtle breathing when shape is at rest) ---
          // Plateau = when easedProgress is near 0 or 1 (shape fully formed)
          const distanceFromPure = Math.min(easedProgress, 1 - easedProgress);
          const plateauThreshold = 0.12; // ~24% of segment is "at rest"
          const inPlateau = distanceFromPure < plateauThreshold;
          
          // Scroll-driven oscillation (micro-scroll creates breathing)
          const breathPhase = Math.sin(progress * 60); // High freq for subtle movement
          const plateauDepth = inPlateau ? 1 - (distanceFromPure / plateauThreshold) : 0;
          const pulseScale = 1 + 0.02 * plateauDepth * (0.5 + 0.5 * breathPhase);
          
          if (containerRotateRef.current && !isReducedMotion) {
            gsap.set(containerRotateRef.current, { scale: pulseScale });
          }

          // --- 3. GRADIENT LOGIC (Direct DOM update) ---
          const colorMain = getGradientColor(progress);
          const colorHighlight = getGradientColor(Math.min(1, progress + 0.15));

          if (gradientStop1Ref.current) gradientStop1Ref.current.setAttribute("stop-color", colorMain);
          if (gradientStop2Ref.current) gradientStop2Ref.current.setAttribute("stop-color", colorHighlight);

          // --- React state for text (throttled by conditional) ---
          const displayWord = localProgress > 0.5 ? toWord : fromWord;
          if (displayWord !== currentWord) {
            setCurrentWord(displayWord);
          }
        },
      });

      // SYNC-ON-MOUNT: Initialize refs to current scroll position
      // Prevents "replay" effect when component remounts mid-scroll
      const initialProgress = trigger.progress;
      if (initialProgress > 0) {
        smoothedProgressRef.current = initialProgress;
        rawProgressRef.current = initialProgress;
        echoProgressRef.current = initialProgress;
        
        // Force immediate visual sync (bypass smooth transition on mount)
        trigger.update(); // Triggers onUpdate with correct progress
      }
    }, section);

    return () => {
      ctx.revert();
      interpolatorsRef.current.clear();
    };
  }, [getInterpolator, isReducedMotion, currentWord]);

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
          <SectionLabel className="mb-8 block">06 / Morph</SectionLabel>

          {/* ROTATION CONTAINER (FIX A: Ghost Wiring)
              Rotates BOTH the SVG and ParticleTrail together to prevent desync */}
          <div
            ref={containerRotateRef}
            className="relative mb-8 will-change-transform"
            style={{ transformOrigin: "center center" }}
          >
            {/* Background Glow */}
            <div
              className="absolute inset-0 -z-10 blur-3xl opacity-20"
              style={{
                background: "radial-gradient(circle, hsl(var(--primary) / 0.3), transparent 70%)",
              }}
            />

            {/* SVG Container with Particles - CENTERED TOGETHER */}
            <div ref={svgContainerRef} className="relative w-full max-w-content-narrow mx-auto">
              <ParticleTrail
                pathDataRef={pathDataRef}
                width={containerSize.width}
                height={containerSize.height}
                viewBox={{ width: 200, height: 140 }}
                particleCount={60}
                scrollProgressRef={rawProgressRef}
              />

              <svg
                viewBox="0 0 200 140"
                className="w-full h-auto relative z-10"
                aria-hidden="true"
              >
                <defs>
                  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <linearGradient id="morphGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop ref={gradientStop1Ref} offset="0%" stopColor="hsl(40, 50%, 75%)" />
                    <stop ref={gradientStop2Ref} offset="100%" stopColor="hsl(35, 60%, 65%)" />
                  </linearGradient>
                </defs>

                {/* Shadow */}
                <path
                  ref={shadowPathRef}
                  d={MORPH_PATHS.motion}
                  fill="hsl(var(--primary) / 0.1)"
                  transform="translate(4, 4)"
                />

                {/* Main fill */}
                <path
                  ref={svgPathRef}
                  d={MORPH_PATHS.motion}
                  fill="url(#morphGradient)"
                  filter="url(#glow)"
                  className="transition-none"
                />

                {/* Echo outline - subtle trailing edge */}
                <path
                  ref={outlinePathRef}
                  d={MORPH_PATHS.motion}
                  fill="none"
                  stroke="hsl(var(--primary) / 0.12)"
                  strokeWidth="0.3"
                  strokeDasharray="2 4"
                />
              </svg>
            </div>
          </div>

          {/* TEXT CONTAINER (FIX B: Layout Thrashing)
              Fixed height prevents CLS during text changes */}
          <div className="relative h-32 mb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentWord}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={TRANSITION.fast}
                className="absolute inset-0 flex flex-col items-center justify-start"
              >
                <h2 className="text-display text-display-lg mb-2">
                  {PRINCIPLES[currentWord].label}
                </h2>
                <p className="text-muted-foreground max-w-content-narrow text-balance text-sm">
                  {PRINCIPLES[currentWord].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-section-2xs mb-8">
            {WORDS.map((word) => (
              <div
                key={word}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  word === currentWord ? "bg-primary scale-125" : "bg-border"
                }`}
              />
            ))}
          </div>

          <motion.div
            className="mt-8 text-mono text-xs text-muted-foreground/50"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: DURATION.pulse * 1.5, repeat: Infinity }}
          >
            Keep scrolling to morph
          </motion.div>
        </SectionContent>

        {/* Background glow */}
        <div
          className="glow w-[500px] h-[500px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 animate-pulse-glow"
          style={{ opacity: 0.2 }}
        />
      </div>
    </section>
  );
};

export default MorphingTextSection;
