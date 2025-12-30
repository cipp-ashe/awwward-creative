import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface EasingCurve {
  name: string;
  label: string;
  fn: (t: number) => number;
  color: string;
}

// Common easing functions
const easingCurves: EasingCurve[] = [
  {
    name: 'linear',
    label: 'Linear',
    fn: (t) => t,
    color: 'hsl(var(--muted-foreground))',
  },
  {
    name: 'easeIn',
    label: 'Ease In',
    fn: (t) => t * t * t,
    color: 'hsl(32, 65%, 55%)',
  },
  {
    name: 'easeOut',
    label: 'Ease Out',
    fn: (t) => 1 - Math.pow(1 - t, 3),
    color: 'hsl(160, 60%, 50%)',
  },
  {
    name: 'easeInOut',
    label: 'Ease In-Out',
    fn: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
    color: 'hsl(280, 55%, 60%)',
  },
  {
    name: 'elastic',
    label: 'Elastic',
    fn: (t) => {
      const c4 = (2 * Math.PI) / 3;
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },
    color: 'hsl(350, 65%, 55%)',
  },
];

interface EasingCurveIndicatorProps {
  scrollProgress: number;
}

const EasingCurveIndicator = ({ scrollProgress }: EasingCurveIndicatorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeCurve, setActiveCurve] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 280, height: 200 });

  // Determine active curve based on scroll progress
  useEffect(() => {
    const segmentSize = 1 / easingCurves.length;
    const index = Math.min(
      Math.floor(scrollProgress / segmentSize),
      easingCurves.length - 1
    );
    setActiveCurve(index);
  }, [scrollProgress]);

  // Draw the easing curves
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const padding = 30;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 4]);

    // Vertical grid lines
    for (let i = 0; i <= 4; i++) {
      const x = padding + (graphWidth * i) / 4;
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (graphHeight * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw all curves
    easingCurves.forEach((curve, curveIndex) => {
      const isActive = curveIndex === activeCurve;
      
      ctx.beginPath();
      ctx.strokeStyle = curve.color;
      ctx.lineWidth = isActive ? 2.5 : 1;
      ctx.globalAlpha = isActive ? 1 : 0.2;

      for (let i = 0; i <= graphWidth; i++) {
        const t = i / graphWidth;
        const easedT = curve.fn(t);
        const x = padding + i;
        const y = height - padding - easedT * graphHeight;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Draw progress indicator on active curve
    const currentCurve = easingCurves[activeCurve];
    const segmentSize = 1 / easingCurves.length;
    const localProgress = (scrollProgress - activeCurve * segmentSize) / segmentSize;
    const clampedProgress = Math.max(0, Math.min(1, localProgress));
    
    const progressX = padding + clampedProgress * graphWidth;
    const progressY = height - padding - currentCurve.fn(clampedProgress) * graphHeight;

    // Progress dot with glow
    ctx.shadowColor = currentCurve.color;
    ctx.shadowBlur = 12;
    ctx.fillStyle = currentCurve.color;
    ctx.beginPath();
    ctx.arc(progressX, progressY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Inner bright dot
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(progressX, progressY, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Vertical line to show current position
    ctx.strokeStyle = currentCurve.color;
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(progressX, padding);
    ctx.lineTo(progressX, height - padding);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Axis labels
    ctx.fillStyle = 'hsl(var(--muted-foreground))';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0', padding, height - padding + 15);
    ctx.fillText('1', width - padding, height - padding + 15);
    ctx.fillText('t (time)', width / 2, height - 5);
    
    ctx.save();
    ctx.translate(10, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('value', 0, 0);
    ctx.restore();

  }, [scrollProgress, activeCurve, dimensions]);

  // Resize observer
  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        if (width > 0) {
          setDimensions({ width: Math.min(width, 320), height: 200 });
        }
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const currentCurve = easingCurves[activeCurve];

  return (
    <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          Easing Curve
        </span>
        <motion.span
          key={currentCurve.name}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-mono text-xs font-medium"
          style={{ color: currentCurve.color }}
        >
          {currentCurve.label}
        </motion.span>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full rounded-lg"
      />

      {/* Curve selector pills */}
      <div className="flex gap-1.5 mt-3 flex-wrap">
        {easingCurves.map((curve, index) => (
          <motion.div
            key={curve.name}
            className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-mono"
            animate={{
              backgroundColor: index === activeCurve 
                ? `${curve.color}20`
                : 'transparent',
              borderColor: index === activeCurve
                ? curve.color
                : 'hsl(var(--border))',
            }}
            style={{
              border: '1px solid',
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: curve.color }}
            />
            <span
              className="transition-colors"
              style={{
                color: index === activeCurve
                  ? curve.color
                  : 'hsl(var(--muted-foreground))',
              }}
            >
              {curve.label}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Phase description */}
      <motion.p
        key={currentCurve.name}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-muted-foreground text-xs mt-3 leading-relaxed"
      >
        {currentCurve.name === 'linear' && 'Constant velocity — no acceleration or deceleration.'}
        {currentCurve.name === 'easeIn' && 'Slow start, accelerating toward the end.'}
        {currentCurve.name === 'easeOut' && 'Fast start, decelerating toward the end.'}
        {currentCurve.name === 'easeInOut' && 'Smooth acceleration and deceleration.'}
        {currentCurve.name === 'elastic' && 'Overshoot with spring-like oscillation.'}
      </motion.p>
    </div>
  );
};

export default EasingCurveIndicator;
