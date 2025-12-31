/**
 * ParticleTrail
 * 
 * Canvas-based particle system that follows SVG path morphing.
 * Performance optimizations:
 * - Device-adaptive particle count (reduced for low-end)
 * - Cached path length (avoids per-frame getTotalLength())
 * - Direct ref-based path updates (bypasses React reconciliation)
 * - Centralized RAF via useTicker (single animation loop)
 */

import { useEffect, useRef, useCallback, useMemo, useState } from 'react';
import { useTicker } from '@/hooks/useTicker';
import { useMotionConfigSafe } from '@/contexts/MotionConfigContext';

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  opacity: number;
  size: number;
  pathPosition: number;
  delay: number;
  isBurst?: boolean;
  velocityX?: number;
  velocityY?: number;
  life?: number;
  maxLife?: number;
}

interface ParticleTrailProps {
  pathDataRef: React.RefObject<string>;
  width: number;
  height: number;
  viewBox: { width: number; height: number };
  particleCount?: number;
  scrollProgressRef?: React.RefObject<number>;
  onMouseMove?: (e: React.MouseEvent) => void;
}

interface MouseBurstParticle {
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
  opacity: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
}

// Color stops for gradient
const colorStops = [
  { h: 32, s: 45, l: 65 },
  { h: 45, s: 60, l: 55 },
  { h: 20, s: 70, l: 50 },
  { h: 350, s: 65, l: 55 },
  { h: 280, s: 50, l: 60 },
];

const lerpColor = (
  c1: { h: number; s: number; l: number },
  c2: { h: number; s: number; l: number },
  t: number
): { h: number; s: number; l: number } => {
  let h1 = c1.h;
  let h2 = c2.h;
  if (Math.abs(h2 - h1) > 180) {
    if (h2 > h1) h1 += 360;
    else h2 += 360;
  }
  return {
    h: (h1 + (h2 - h1) * t) % 360,
    s: c1.s + (c2.s - c1.s) * t,
    l: c1.l + (c2.l - c1.l) * t,
  };
};

const getGradientColor = (position: number, scrollProgress: number): string => {
  const scrollOffset = scrollProgress * 2;
  const shiftedPosition = (position + scrollOffset) % 1;
  const numStops = colorStops.length;
  const scaledPos = shiftedPosition * (numStops - 1);
  const stopIndex = Math.floor(scaledPos);
  const t = scaledPos - stopIndex;
  const c1 = colorStops[stopIndex % numStops];
  const c2 = colorStops[(stopIndex + 1) % numStops];
  const color = lerpColor(c1, c2, t);
  return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
};

// Constants for velocity-based emission (dynamic scaling)
const VELOCITY_THRESHOLD = 0.005;  // Lower threshold for earlier trigger
const MAX_BURST_PARTICLES = 80;    // Increased capacity for drama
const BURST_SPAWN_COUNT_MIN = 3;
const BURST_SPAWN_COUNT_MAX = 14;
const BURST_LIFETIME_BASE = 50;
const BURST_LIFETIME_MAX = 100;

const MOUSE_BURST_COUNT = 3;
const MOUSE_BURST_LIFETIME = 45;
const MAX_MOUSE_BURST = 60;

/**
 * Detect low-end device for adaptive particle count
 * Uses hardware concurrency and device memory as heuristics
 */
const detectLowEndDevice = (): boolean => {
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as { deviceMemory?: number }).deviceMemory || 4;
  return cores <= 2 || memory <= 2;
};

const ParticleTrail = ({
  pathDataRef,
  width,
  height,
  viewBox,
  particleCount = 60,
  scrollProgressRef,
}: ParticleTrailProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const burstParticlesRef = useRef<Particle[]>([]);
  const mouseBurstRef = useRef<MouseBurstParticle[]>([]);
  const pathRef = useRef<SVGPathElement | null>(null);
  const pathLengthRef = useRef(0); // Cached path length for performance
  const prevScrollRef = useRef(0);
  const velocityRef = useRef(0);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const isHoveringRef = useRef(false);
  const lastPathRef = useRef<string>(''); // Track path changes for cache invalidation
  
  const { shouldAnimate } = useMotionConfigSafe();
  
  // Visibility gating: pause animation when off-screen to save CPU
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1, rootMargin: '100px' }
    );
    
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);
  
  // Device-adaptive particle count (memoized once)
  const effectiveParticleCount = useMemo(() => {
    const isLowEnd = detectLowEndDevice();
    return isLowEnd ? Math.floor(particleCount * 0.5) : particleCount;
  }, [particleCount]);
  
  // Store dimensions in refs to prevent callback churn
  const dimensionsRef = useRef({ width, height });
  useEffect(() => {
    dimensionsRef.current = { width, height };
  }, [width, height]);

  // Use cached path length for performance (avoids getTotalLength() per frame)
  const getPointAtPosition = useCallback((path: SVGPathElement, position: number): { x: number; y: number } => {
    const length = pathLengthRef.current || path.getTotalLength();
    const point = path.getPointAtLength(position * length);
    return { x: point.x, y: point.y };
  }, []);

  /**
   * Convert SVG coordinates to canvas coordinates.
   * Accounts for SVG's preserveAspectRatio="xMidYMid meet" behavior
   * which centers content with letterboxing/pillarboxing on aspect mismatch.
   */
  const svgToCanvas = useCallback((svgX: number, svgY: number): { x: number; y: number } => {
    const containerAspect = width / height;
    const viewBoxAspect = viewBox.width / viewBox.height;
    
    let renderWidth: number;
    let renderHeight: number;
    let offsetX: number;
    let offsetY: number;
    
    if (containerAspect > viewBoxAspect) {
      // Container is wider than viewBox - height-constrained (pillarboxing)
      renderHeight = height;
      renderWidth = height * viewBoxAspect;
      offsetX = (width - renderWidth) / 2;
      offsetY = 0;
    } else {
      // Container is taller than viewBox - width-constrained (letterboxing)
      renderWidth = width;
      renderHeight = width / viewBoxAspect;
      offsetX = 0;
      offsetY = (height - renderHeight) / 2;
    }
    
    // Map SVG coordinates to the actual rendered area
    const scaleX = renderWidth / viewBox.width;
    const scaleY = renderHeight / viewBox.height;
    
    return {
      x: offsetX + svgX * scaleX,
      y: offsetY + svgY * scaleY
    };
  }, [width, height, viewBox]);

  /**
   * Initialize particles directly on the SVG path.
   * Requires valid path and container dimensions to calculate positions.
   */
  const initializeParticlesOnPath = useCallback((path: SVGPathElement) => {
    const particles: Particle[] = [];
    const pathLength = path.getTotalLength();
    
    // Guard: need valid dimensions for svgToCanvas
    if (width <= 0 || height <= 0 || pathLength <= 0) {
      // Fallback: initialize at center, will snap to path on first frame
      const centerX = width / 2 || 0;
      const centerY = height / 2 || 0;
      for (let i = 0; i < effectiveParticleCount; i++) {
        particles.push({
          x: centerX,
          y: centerY,
          targetX: centerX,
          targetY: centerY,
          opacity: 0.5 + Math.random() * 0.4,
          size: 2.5 + Math.random() * 3.5,
          pathPosition: i / effectiveParticleCount,
          delay: 0.02 + Math.random() * 0.08,
        });
      }
      particlesRef.current = particles;
      return;
    }
    
    for (let i = 0; i < effectiveParticleCount; i++) {
      const pathPosition = i / effectiveParticleCount;
      const point = path.getPointAtLength(pathPosition * pathLength);
      const canvasPoint = svgToCanvas(point.x, point.y);
      
      particles.push({
        x: canvasPoint.x,
        y: canvasPoint.y,
        targetX: canvasPoint.x,
        targetY: canvasPoint.y,
        opacity: 0.5 + Math.random() * 0.4,
        size: 2.5 + Math.random() * 3.5,
        pathPosition,
        delay: 0.02 + Math.random() * 0.08,
      });
    }
    particlesRef.current = particles;
  }, [effectiveParticleCount, width, height, svgToCanvas]);

  // Spawn burst particles at high velocity points - intensity scales with scroll speed
  const spawnBurstParticles = useCallback(() => {
    if (!pathRef.current) return;
    if (burstParticlesRef.current.length >= MAX_BURST_PARTICLES) return;

    const path = pathRef.current;
    
    // Velocity-based intensity scaling (0-1 normalized)
    const velocityIntensity = Math.min(1, velocityRef.current / 0.025);
    
    // Dynamic spawn count and lifetime based on velocity
    const spawnCount = Math.floor(
      BURST_SPAWN_COUNT_MIN + (BURST_SPAWN_COUNT_MAX - BURST_SPAWN_COUNT_MIN) * velocityIntensity
    );
    const lifetime = Math.floor(
      BURST_LIFETIME_BASE + (BURST_LIFETIME_MAX - BURST_LIFETIME_BASE) * velocityIntensity
    );

    for (let i = 0; i < spawnCount; i++) {
      const pathPos = Math.random();
      const svgPoint = getPointAtPosition(path, pathPos);
      const canvasPoint = svgToCanvas(svgPoint.x, svgPoint.y);
      
      // Velocity scales burst radius and speed
      const angle = Math.random() * Math.PI * 2;
      const baseSpeed = 1.5 + velocityIntensity * 4;  // Faster at high velocity
      const speed = baseSpeed + Math.random() * 2.5;
      
      // Larger particles at higher velocity
      const sizeMultiplier = 1 + velocityIntensity * 0.8;
      
      burstParticlesRef.current.push({
        x: canvasPoint.x,
        y: canvasPoint.y,
        targetX: canvasPoint.x,
        targetY: canvasPoint.y,
        opacity: 0.7 + Math.random() * 0.3,
        size: (2.5 + Math.random() * 3.5) * sizeMultiplier,
        pathPosition: pathPos,
        delay: 0,
        isBurst: true,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: lifetime,
        maxLife: lifetime,
      });
    }
  }, [getPointAtPosition, svgToCanvas]);

  // Spawn mouse-follow burst particles
  const spawnMouseBurst = useCallback((mouseX: number, mouseY: number) => {
    if (mouseBurstRef.current.length >= MAX_MOUSE_BURST) return;
    
    const currentScroll = scrollProgressRef.current;
    const baseHue = 32 + currentScroll * 300; // Cycle through hues based on scroll
    
    for (let i = 0; i < MOUSE_BURST_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      const hueVariation = (Math.random() - 0.5) * 40;
      
      mouseBurstRef.current.push({
        x: mouseX + (Math.random() - 0.5) * 10,
        y: mouseY + (Math.random() - 0.5) * 10,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        opacity: 0.7 + Math.random() * 0.3,
        size: 2 + Math.random() * 4,
        life: MOUSE_BURST_LIFETIME,
        maxLife: MOUSE_BURST_LIFETIME,
        hue: (baseHue + hueVariation) % 360,
      });
    }
  }, []);

  // Handle mouse move on canvas
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    // Calculate mouse velocity
    const dx = mouseX - lastMousePosRef.current.x;
    const dy = mouseY - lastMousePosRef.current.y;
    const mouseSpeed = Math.sqrt(dx * dx + dy * dy);
    
    lastMousePosRef.current = { x: mouseX, y: mouseY };
    
    // Only spawn if moving fast enough
    if (mouseSpeed > 3) {
      spawnMouseBurst(mouseX, mouseY);
    }
  }, [spawnMouseBurst]);

  const handleMouseEnter = useCallback(() => {
    isHoveringRef.current = true;
  }, []);

  const handleMouseLeave = useCallback(() => {
    isHoveringRef.current = false;
  }, []);

  const updateParticleTargets = useCallback(() => {
    if (!pathRef.current) return;
    
    const path = pathRef.current;
    const particles = particlesRef.current;
    const velocity = velocityRef.current;

    particles.forEach((particle) => {
      const svgPoint = getPointAtPosition(path, particle.pathPosition);
      const canvasPoint = svgToCanvas(svgPoint.x, svgPoint.y);
      particle.targetX = canvasPoint.x;
      particle.targetY = canvasPoint.y;
    });

    // Spawn burst particles when velocity exceeds threshold
    if (velocity > VELOCITY_THRESHOLD) {
      spawnBurstParticles();
    }
  }, [getPointAtPosition, svgToCanvas, spawnBurstParticles]);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    // Update path from ref if changed (cache invalidation)
    const currentPathData = pathDataRef.current;
    if (currentPathData && pathRef.current && currentPathData !== lastPathRef.current) {
      pathRef.current.setAttribute('d', currentPathData);
      pathLengthRef.current = pathRef.current.getTotalLength();
      lastPathRef.current = currentPathData;
      updateParticleTargets();
    }
    
    // Track scroll velocity from ref
    const currentScroll = scrollProgressRef?.current ?? 0;
    const delta = Math.abs(currentScroll - prevScrollRef.current);
    velocityRef.current = delta;
    prevScrollRef.current = currentScroll;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const burstParticles = burstParticlesRef.current;

    // Draw trail particles with orbital spread for expanded presence
    particles.forEach((particle) => {
      // Orbital spread: particles drift away from path in a swirling pattern
      const spreadAmount = 10 + Math.sin(particle.pathPosition * Math.PI * 4) * 8;
      const spreadAngle = particle.pathPosition * Math.PI * 2 + currentScroll * 3;
      const spreadX = Math.cos(spreadAngle) * spreadAmount;
      const spreadY = Math.sin(spreadAngle) * spreadAmount;
      
      // Faster response to reduce perceived lag (~5-6 frames to 63% target)
      const smoothFactor = 0.18;
      particle.x += (particle.targetX + spreadX - particle.x) * smoothFactor;
      particle.y += (particle.targetY + spreadY - particle.y) * smoothFactor;

      const particleColor = getGradientColor(particle.pathPosition, currentScroll);

      // Outer glow - expanded presence
      ctx.fillStyle = particleColor;
      ctx.globalAlpha = particle.opacity * 0.2;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 4, 0, Math.PI * 2);
      ctx.fill();

      // Mid glow layer
      ctx.globalAlpha = particle.opacity * 0.35;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Core particle
      ctx.globalAlpha = particle.opacity;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      // Bright center
      ctx.globalAlpha = particle.opacity * 0.85;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Update and draw burst particles
    for (let i = burstParticles.length - 1; i >= 0; i--) {
      const p = burstParticles[i];
      
      // Update position with velocity and friction
      p.x += p.velocityX!;
      p.y += p.velocityY!;
      p.velocityX! *= 0.96;
      p.velocityY! *= 0.96;
      p.life!--;

      // Calculate life ratio for fade out
      const lifeRatio = p.life! / p.maxLife!;
      const fadeOpacity = p.opacity * lifeRatio;
      const fadeSize = p.size * (0.5 + lifeRatio * 0.5);

      const particleColor = getGradientColor(p.pathPosition, currentScroll);

      // Draw with fade
      ctx.fillStyle = particleColor;
      ctx.globalAlpha = fadeOpacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, fadeSize, 0, Math.PI * 2);
      ctx.fill();

      // Glow
      ctx.globalAlpha = fadeOpacity * 0.4;
      ctx.beginPath();
      ctx.arc(p.x, p.y, fadeSize * 2, 0, Math.PI * 2);
      ctx.fill();

      // Remove dead particles
      if (p.life! <= 0) {
        burstParticles.splice(i, 1);
      }
    }

    // Update and draw mouse burst particles
    const mouseBurst = mouseBurstRef.current;
    for (let i = mouseBurst.length - 1; i >= 0; i--) {
      const p = mouseBurst[i];
      
      // Update with physics
      p.x += p.velocityX;
      p.y += p.velocityY;
      p.velocityX *= 0.94;
      p.velocityY *= 0.94;
      p.velocityY += 0.05; // Slight gravity
      p.life--;

      const lifeRatio = p.life / p.maxLife;
      const fadeOpacity = p.opacity * lifeRatio;
      const fadeSize = p.size * (0.3 + lifeRatio * 0.7);

      // Color based on hue
      const color = `hsl(${p.hue}, 65%, 60%)`;

      // Core particle
      ctx.fillStyle = color;
      ctx.globalAlpha = fadeOpacity;
      ctx.beginPath();
      ctx.arc(p.x, p.y, fadeSize, 0, Math.PI * 2);
      ctx.fill();

      // Outer glow
      ctx.globalAlpha = fadeOpacity * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, fadeSize * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright core
      ctx.fillStyle = `hsl(${p.hue}, 80%, 80%)`;
      ctx.globalAlpha = fadeOpacity * 0.9;
      ctx.beginPath();
      ctx.arc(p.x, p.y, fadeSize * 0.4, 0, Math.PI * 2);
      ctx.fill();

      if (p.life <= 0) {
        mouseBurst.splice(i, 1);
      }
    }

    ctx.globalAlpha = 1;
  }, []);

  useEffect(() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(path);
    pathRef.current = path;
    
    // Initialize with current path data
    const initialPath = pathDataRef.current;
    if (initialPath) {
      path.setAttribute('d', initialPath);
      pathLengthRef.current = path.getTotalLength();
      lastPathRef.current = initialPath;
      // Initialize particles ON the path (not at 0,0)
      initializeParticlesOnPath(path);
    }
    
    return () => { pathRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Stable deps - use refs for dynamic values

  // Use central ticker with visibility gating
  useTicker(animate, shouldAnimate && isVisible);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }
  }, [width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="absolute inset-0 cursor-none"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden="true"
    />
  );
};

export default ParticleTrail;
