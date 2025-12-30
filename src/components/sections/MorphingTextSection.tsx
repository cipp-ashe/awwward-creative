/**
 * MorphingTextSection
 *
 * SVG path morphing with three critical architectural fixes:
 * 1. Ghost Wiring Fix: Parent container rotates BOTH SVG and Canvas particles
 * 2. Layout Thrashing Fix: Fixed-height text container prevents CLS
 * 3. Main-Thread Choke Fix: Direct DOM manipulation bypasses React render cycle
 *
 * Uses d3-interpolate for matched-topology path interpolation.
 * Canvas-based particles for zero React state overhead.
 */

import { useEffect, useRef, useState, useCallback, RefObject } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { interpolateString } from "d3-interpolate";
import { motion, AnimatePresence } from "framer-motion";
import { SectionContent, SectionLabel } from "@/components/layout/Section";
import { TRANSITION, EASING_FN, DURATION } from "@/constants/animation";
import { useMotionConfigSafe } from "@/contexts/MotionConfigContext";

// 12-point topology invariant paths for artifact-free interpolation
const MORPH_PATHS = {
  motion: "M20,20 L100,20 L120,40 L160,40 L180,60 L160,80 L120,80 L100,100 L20,100 L50,80 L50,40 L20,20 Z",
  scroll: "M60,20 L140,20 L140,40 L60,40 L60,50 L140,50 L140,70 L60,70 L60,80 L140,80 L140,100 L60,100 Z",
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

// Color interpolation: Champagne -> Rose -> Amber
const getGradientColor = (progress: number, offset = 0): string => {
  const p = Math.max(0, Math.min(1, progress + offset));
  if (p < 0.5) {
    const t = p * 2;
    const h = 40 + (-10 - 40) * t;
    const s = 50 + (60 - 50) * t;
    const l = 75 + (70 - 75) * t;
    return `hsl(${h < 0 ? 360 + h : h}, ${s}%, ${l}%)`;
  } else {
    const t = (p - 0.5) * 2;
    const h = -10 + (35 - -10) * t;
    const s = 60 + (80 - 60) * t;
    const l = 70 + (60 - 70) * t;
    return `hsl(${h < 0 ? 360 + h : h}, ${s}%, ${l}%)`;
  }
};

// Canvas-based particle system - zero React state overhead
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

const useEdgeParticles = (
  canvasRef: RefObject<HTMLCanvasElement>,
  pathRef: RefObject<SVGPathElement>
) => {
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const emitRef = useRef<(velocity: number, progress: number) => void>(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Resize canvas to match display size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Emit particles along path edges
    emitRef.current = (velocity: number, progress: number) => {
      const path = pathRef.current;
      if (!path || Math.abs(velocity) < 50) return;

      const rect = canvas.getBoundingClientRect();
      const pathLength = path.getTotalLength();
      const emitCount = Math.min(3, Math.floor(Math.abs(velocity) / 200));

      for (let i = 0; i < emitCount; i++) {
        const point = path.getPointAtLength(Math.random() * pathLength);
        // Convert SVG coords (0-200) to canvas coords
        const scaleX = rect.width / 200;
        const scaleY = rect.height / 140;

        particlesRef.current.push({
          x: point.x * scaleX,
          y: point.y * scaleY,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 + velocity * 0.001,
          life: 1,
          maxLife: 1,
          size: 1 + Math.random() * 2,
          hue: 35 + progress * 15, // Shift hue with progress
        });
      }

      // Cap particles
      if (particlesRef.current.length > 100) {
        particlesRef.current = particlesRef.current.slice(-100);
      }
    };

    // Animation loop
    const animate = () => {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      particlesRef.current = particlesRef.current.filter((p) => {
        p.life -= 0.02;
        if (p.life <= 0) return false;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.02; // Gravity

        const alpha = p.life * 0.6;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 70%, 65%, ${alpha})`;
        ctx.fill();

        return true;
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [canvasRef, pathRef]);

  return emitRef;
};

const MorphingTextSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  // Refs for Direct DOM Manipulation (bypasses React render cycle)
  const svgPathRef = useRef<SVGPathElement>(null);
  const shadowPathRef = useRef<SVGPathElement>(null);
  const containerRotateRef = useRef<HTMLDivElement>(null);
  const gradientStop1Ref = useRef<SVGStopElement>(null);
  const gradientStop2Ref = useRef<SVGStopElement>(null);

  // Echo refs for trailing ghost shapes
  const echo1Ref = useRef<SVGPathElement>(null);
  const echo2Ref = useRef<SVGPathElement>(null);
  const echo3Ref = useRef<SVGPathElement>(null);
  const laggedProgressRef = useRef({ p1: 0, p2: 0, p3: 0 });

  // Canvas particle refs
  const edgeCanvasRef = useRef<HTMLCanvasElement>(null);
  const emitParticles = useEdgeParticles(edgeCanvasRef, svgPathRef);

  // Logic refs
  const interpolatorsRef = useRef<Map<string, (t: number) => string>>(new Map());

  // React state for SEMANTIC updates only (text content) - updates ~5 times total
  const [currentWord, setCurrentWord] = useState<WordKey>("motion");

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

  // Get path for a given progress (for echoes)
  const getPathForProgress = useCallback(
    (progress: number) => {
      const totalTransitions = WORDS.length - 1;
      const segmentProgress = Math.max(0, Math.min(totalTransitions, progress * totalTransitions));
      const currentIndex = Math.min(Math.floor(segmentProgress), totalTransitions - 1);
      const nextIndex = Math.min(currentIndex + 1, WORDS.length - 1);
      const localProgress = segmentProgress - currentIndex;
      const easedLocal = EASING_FN.easeInOutCubic(Math.max(0, Math.min(1, localProgress)));
      return getInterpolator(WORDS[currentIndex], WORDS[nextIndex])(easedLocal);
    },
    [getInterpolator]
  );

  // Main scroll-driven animation
  useEffect(() => {
    if (isReducedMotion) return;

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
          const velocity = self.getVelocity();

          // --- 1. MORPH LOGIC ---
          const totalTransitions = WORDS.length - 1;
          const segmentProgress = progress * totalTransitions;
          const currentIndex = Math.min(Math.floor(segmentProgress), totalTransitions - 1);
          const nextIndex = Math.min(currentIndex + 1, WORDS.length - 1);
          const localProgress = segmentProgress - currentIndex;

          const fromWord = WORDS[currentIndex];
          const toWord = WORDS[nextIndex];

          const interp = getInterpolator(fromWord, toWord);
          const easedProgress = EASING_FN.easeInOutCubic(Math.max(0, Math.min(1, localProgress)));
          const newPath = interp(easedProgress);

          // Direct DOM update (fast - bypasses React)
          if (svgPathRef.current) svgPathRef.current.setAttribute("d", newPath);
          if (shadowPathRef.current) shadowPathRef.current.setAttribute("d", newPath);

          // --- 2. ECHOES (lagged ghost shapes) ---
          const lagFactor = 0.08;
          laggedProgressRef.current.p1 += (progress - laggedProgressRef.current.p1) * lagFactor * 3;
          laggedProgressRef.current.p2 += (progress - laggedProgressRef.current.p2) * lagFactor * 2;
          laggedProgressRef.current.p3 += (progress - laggedProgressRef.current.p3) * lagFactor * 1;

          if (echo1Ref.current) echo1Ref.current.setAttribute("d", getPathForProgress(laggedProgressRef.current.p1));
          if (echo2Ref.current) echo2Ref.current.setAttribute("d", getPathForProgress(laggedProgressRef.current.p2));
          if (echo3Ref.current) echo3Ref.current.setAttribute("d", getPathForProgress(laggedProgressRef.current.p3));

          // --- 3. PARTICLES (Canvas-based, no React state) ---
          if (emitParticles.current) emitParticles.current(velocity, progress);

          // --- 4. ROTATION LOGIC (velocity-based tilt) ---
          const maxTilt = 12;
          const tilt = Math.max(-maxTilt, Math.min(maxTilt, velocity / 80));
          if (containerRotateRef.current) {
            gsap.set(containerRotateRef.current, { rotation: tilt, transformOrigin: "center center" });
          }

          // --- 5. GRADIENT LOGIC (direct attribute update) ---
          if (gradientStop1Ref.current) gradientStop1Ref.current.setAttribute("stop-color", getGradientColor(progress));
          if (gradientStop2Ref.current) gradientStop2Ref.current.setAttribute("stop-color", getGradientColor(progress, 0.2));

          // --- React state for text (ONLY when word changes) ---
          const displayWord = localProgress > 0.5 ? toWord : fromWord;
          if (displayWord !== currentWord) {
            setCurrentWord(displayWord);
          }
          // ❌ REMOVED: setCurrentPath(newPath) - this was the "earthquake" generator
        },
      });
    }, section);

    return () => {
      ctx.revert();
      interpolatorsRef.current.clear();
    };
  }, [getInterpolator, getPathForProgress, isReducedMotion, currentWord, emitParticles]);

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
          <SectionLabel className="mb-8 block">06 — Principles</SectionLabel>

          {/* ROTATION CONTAINER - Rotates BOTH SVG and Canvas particles together */}
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

            {/* SVG Container with Canvas Particles */}
            <div className="relative">
              {/* Canvas for particles - positioned over SVG */}
              <canvas
                ref={edgeCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none z-20"
              />

              <svg
                viewBox="0 0 200 140"
                className="w-full max-w-lg mx-auto h-auto relative z-10"
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

                {/* Echo trails (lagged ghost shapes) */}
                <path
                  ref={echo3Ref}
                  d={MORPH_PATHS.motion}
                  fill="none"
                  stroke="hsl(var(--primary) / 0.1)"
                  strokeWidth="0.3"
                />
                <path
                  ref={echo2Ref}
                  d={MORPH_PATHS.motion}
                  fill="none"
                  stroke="hsl(var(--primary) / 0.2)"
                  strokeWidth="0.4"
                />
                <path
                  ref={echo1Ref}
                  d={MORPH_PATHS.motion}
                  fill="none"
                  stroke="hsl(var(--primary) / 0.35)"
                  strokeWidth="0.5"
                />

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
              </svg>
            </div>
          </div>

          {/* TEXT CONTAINER - Fixed height prevents CLS during text changes */}
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
                <p className="text-muted-foreground max-w-md text-balance text-sm">
                  {PRINCIPLES[currentWord].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-3 mb-8">
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
        <div className="glow w-[500px] h-[500px] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-15 animate-pulse-glow" />
      </div>
    </section>
  );
};

export default MorphingTextSection;
