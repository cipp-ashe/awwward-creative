import { useEffect, useRef, useCallback } from 'react';

interface Particle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  opacity: number;
  size: number;
  pathPosition: number; // 0-1 along the path
  delay: number; // Trail delay factor
}

interface ParticleTrailProps {
  pathData: string;
  width: number;
  height: number;
  viewBox: { width: number; height: number };
  particleCount?: number;
  scrollProgress?: number;
}

// Color stops for gradient - shifts based on scroll
const colorStops = [
  { h: 32, s: 45, l: 65 },   // Primary amber
  { h: 45, s: 60, l: 55 },   // Golden
  { h: 20, s: 70, l: 50 },   // Orange
  { h: 350, s: 65, l: 55 },  // Rose
  { h: 280, s: 50, l: 60 },  // Purple
];

// Interpolate between two HSL colors
const lerpColor = (
  c1: { h: number; s: number; l: number },
  c2: { h: number; s: number; l: number },
  t: number
): { h: number; s: number; l: number } => {
  // Handle hue wrapping for shortest path
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

// Get color at position along gradient, shifted by scroll
const getGradientColor = (position: number, scrollProgress: number): string => {
  // Scroll shifts the entire gradient palette
  const scrollOffset = scrollProgress * 2; // Scroll through 2 color cycles
  const shiftedPosition = (position + scrollOffset) % 1;
  
  // Map position to color stops
  const numStops = colorStops.length;
  const scaledPos = shiftedPosition * (numStops - 1);
  const stopIndex = Math.floor(scaledPos);
  const t = scaledPos - stopIndex;
  
  const c1 = colorStops[stopIndex % numStops];
  const c2 = colorStops[(stopIndex + 1) % numStops];
  
  const color = lerpColor(c1, c2, t);
  return `hsl(${color.h}, ${color.s}%, ${color.l}%)`;
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
  const pathRef = useRef<SVGPathElement | null>(null);
  const rafRef = useRef<number>();
  const scrollProgressRef = useRef(scrollProgress);

  // Keep scroll progress in ref for animation loop
  useEffect(() => {
    scrollProgressRef.current = scrollProgress;
  }, [scrollProgress]);

  // Initialize particles
  const initializeParticles = useCallback(() => {
    const particles: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      const pathPosition = i / particleCount;
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
  }, [particleCount]);

  // Sample point from path at given position (0-1)
  const getPointAtPosition = useCallback((path: SVGPathElement, position: number): { x: number; y: number } => {
    const length = path.getTotalLength();
    const point = path.getPointAtLength(position * length);
    return { x: point.x, y: point.y };
  }, []);

  // Convert SVG coordinates to canvas coordinates
  const svgToCanvas = useCallback((svgX: number, svgY: number): { x: number; y: number } => {
    const scaleX = width / viewBox.width;
    const scaleY = height / viewBox.height;
    return {
      x: svgX * scaleX,
      y: svgY * scaleY,
    };
  }, [width, height, viewBox]);

  // Update particle targets when path changes
  const updateParticleTargets = useCallback(() => {
    if (!pathRef.current) return;
    
    const path = pathRef.current;
    const particles = particlesRef.current;

    particles.forEach((particle) => {
      const svgPoint = getPointAtPosition(path, particle.pathPosition);
      const canvasPoint = svgToCanvas(svgPoint.x, svgPoint.y);
      particle.targetX = canvasPoint.x;
      particle.targetY = canvasPoint.y;
    });
  }, [getPointAtPosition, svgToCanvas]);

  // Animation loop
  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const particles = particlesRef.current;
    const currentScroll = scrollProgressRef.current;

    particles.forEach((particle) => {
      // Lerp towards target with delay-based easing (trail effect)
      const lerpFactor = 1 - particle.delay;
      particle.x += (particle.targetX - particle.x) * lerpFactor;
      particle.y += (particle.targetY - particle.y) * lerpFactor;

      // Get scroll-shifted gradient color based on particle's path position
      const particleColor = getGradientColor(particle.pathPosition, currentScroll);

      // Draw particle core
      ctx.fillStyle = particleColor;
      ctx.globalAlpha = particle.opacity;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      // Draw outer glow with same color
      ctx.globalAlpha = particle.opacity * 0.25;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw inner bright core
      ctx.globalAlpha = particle.opacity * 0.8;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    rafRef.current = requestAnimationFrame(animate);
  }, []);

  // Create offscreen SVG path element
  useEffect(() => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(path);
    pathRef.current = path;

    initializeParticles();

    return () => {
      pathRef.current = null;
    };
  }, [initializeParticles]);

  // Update path data
  useEffect(() => {
    if (pathRef.current && pathData) {
      pathRef.current.setAttribute('d', pathData);
      updateParticleTargets();
    }
  }, [pathData, updateParticleTargets]);

  // Start animation loop
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [animate]);

  // Handle canvas resize
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
      className="absolute inset-0 pointer-events-none"
      style={{ mixBlendMode: 'screen' }}
      aria-hidden="true"
    />
  );
};

export default ParticleTrail;
