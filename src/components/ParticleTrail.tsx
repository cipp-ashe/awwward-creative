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

import { useEffect, useRef, useCallback, useMemo } from 'react';
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
  pathData: string;
  width: number;
  height: number;
  viewBox: { width: number; height: number };
  particleCount?: number;
  scrollProgress?: number;
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

// Constants for velocity-based emission
const VELOCITY_THRESHOLD = 0.008;
const MAX_BURST_PARTICLES = 40;
const BURST_SPAWN_COUNT = 5;
const BURST_LIFETIME = 60; // frames

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
  pathData,
  width,
  height,
  viewBox,
  particleCount = 60,
  scrollProgress = 0,
}: ParticleTrailProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const burstParticlesRef = useRef<Particle[]>([]);
  const mouseBurstRef = useRef<MouseBurstParticle[]>([]);
  const pathRef = useRef<SVGPathElement | null>(null);
  const pathLengthRef = useRef(0); // Cached path length for performance
  const scrollProgressRef = useRef(scrollProgress);
  const prevScrollRef = useRef(scrollProgress);
  const velocityRef = useRef(0);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const isHoveringRef = useRef(false);
  
  const { shouldAnimate } = useMotionConfigSafe();
  
  // Device-adaptive particle count (memoized once)
  const effectiveParticleCount = useMemo(() => {
    const isLowEnd = detectLowEndDevice();
    return isLowEnd ? Math.floor(particleCount * 0.5) : particleCount;
  }, [particleCount]);

  // Track scroll velocity
  useEffect(() => {
    const delta = Math.abs(scrollProgress - prevScrollRef.current);
    velocityRef.current = delta;
    prevScrollRef.current = scrollProgress;
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  const initializeParticles = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < effectiveParticleCount; i++) {
      const pathPosition = i / effectiveParticleCount;
      particles.push({
        x: 0,
        y: 0,
        targetX: 0,
        targetY: 0,
        opacity: 0.4 + Math.random() * 0.5,
        size: 1.5 + Math.random() * 2.5,
        pathPosition,
        delay: 0.02 + Math.random() * 0.08,
      });
    }
    particlesRef.current = particles;
  }, [effectiveParticleCount]);

  // Use cached path length for performance (avoids getTotalLength() per frame)
  const getPointAtPosition = useCallback((path: SVGPathElement, position: number): { x: number; y: number } => {
    const length = pathLengthRef.current || path.getTotalLength();
    const point = path.getPointAtLength(position * length);
    return { x: point.x, y: point.y };
  }, []);

  const svgToCanvas = useCallback((svgX: number, svgY: number): { x: number; y: number } => {
    const scaleX = width / viewBox.width;
    const scaleY = height / viewBox.height;
    return { x: svgX * scaleX, y: svgY * scaleY };
  }, [width, height, viewBox]);

  // Spawn burst particles at high velocity points
  const spawnBurstParticles = useCallback(() => {
    if (!pathRef.current) return;
    if (burstParticlesRef.current.length >= MAX_BURST_PARTICLES) return;

    const path = pathRef.current;

    for (let i = 0; i < BURST_SPAWN_COUNT; i++) {
      const pathPos = Math.random();
      const svgPoint = getPointAtPosition(path, pathPos);
      const canvasPoint = svgToCanvas(svgPoint.x, svgPoint.y);
      
      // Random velocity direction with magnitude based on scroll velocity
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + velocityRef.current * 100;
      
      burstParticlesRef.current.push({
        x: canvasPoint.x,
        y: canvasPoint.y,
        targetX: canvasPoint.x,
        targetY: canvasPoint.y,
        opacity: 0.8 + Math.random() * 0.2,
        size: 2 + Math.random() * 3,
        pathPosition: pathPos,
        delay: 0,
        isBurst: true,
        velocityX: Math.cos(angle) * speed,
        velocityY: Math.sin(angle) * speed,
        life: BURST_LIFETIME,
        maxLife: BURST_LIFETIME,
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

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const burstParticles = burstParticlesRef.current;
    const currentScroll = scrollProgressRef.current;

    // Draw trail particles with smoother lerp
    particles.forEach((particle) => {
      // Slower, more intentional movement aligned with cubic easing
      const smoothFactor = 0.12;
      particle.x += (particle.targetX - particle.x) * smoothFactor;
      particle.y += (particle.targetY - particle.y) * smoothFactor;

      const particleColor = getGradientColor(particle.pathPosition, currentScroll);

      ctx.fillStyle = particleColor;
      ctx.globalAlpha = particle.opacity;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = particle.opacity * 0.25;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = particle.opacity * 0.8;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
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
    initializeParticles();
    return () => { pathRef.current = null; };
  }, [initializeParticles]);

  // Update path and cache length when pathData changes
  useEffect(() => {
    if (pathRef.current && pathData) {
      pathRef.current.setAttribute('d', pathData);
      // Cache path length to avoid per-frame getTotalLength() calls
      pathLengthRef.current = pathRef.current.getTotalLength();
      updateParticleTargets();
    }
  }, [pathData, updateParticleTargets]);

  // Use central ticker instead of standalone RAF
  useTicker(animate, shouldAnimate);

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
