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
  color?: string;
}

const ParticleTrail = ({
  pathData,
  width,
  height,
  viewBox,
  particleCount = 50,
  color = 'hsl(32, 45%, 65%)',
}: ParticleTrailProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const pathRef = useRef<SVGPathElement | null>(null);
  const rafRef = useRef<number>();
  const previousPathRef = useRef<string>(pathData);

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
        opacity: 0.3 + Math.random() * 0.5,
        size: 1 + Math.random() * 2,
        pathPosition,
        delay: 0.02 + Math.random() * 0.08, // Random delay for trail effect
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

    // Parse color for drawing
    ctx.fillStyle = color;

    const particles = particlesRef.current;

    particles.forEach((particle) => {
      // Lerp towards target with delay-based easing (trail effect)
      const lerpFactor = 1 - particle.delay;
      particle.x += (particle.targetX - particle.x) * lerpFactor;
      particle.y += (particle.targetY - particle.y) * lerpFactor;

      // Draw particle
      ctx.globalAlpha = particle.opacity;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      // Draw trail glow
      ctx.globalAlpha = particle.opacity * 0.3;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    rafRef.current = requestAnimationFrame(animate);
  }, [color]);

  // Create offscreen SVG path element
  useEffect(() => {
    // Create an offscreen SVG to use getPointAtLength
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
      previousPathRef.current = pathData;
    }
  }, [pathData, updateParticleTargets]);

  // Start animation loop
  useEffect(() => {
    // Check for reduced motion
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
