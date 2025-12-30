import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Point {
  x: number;
  y: number;
}

interface BezierCurveEditorProps {
  className?: string;
}

// Preset curves
const presets: Record<string, [number, number, number, number]> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1],
  'ease-in-back': [0.6, -0.28, 0.735, 0.045],
  'ease-out-back': [0.175, 0.885, 0.32, 1.275],
  'ease-in-out-back': [0.68, -0.55, 0.265, 1.55],
};

const BezierCurveEditor = ({ className = '' }: BezierCurveEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Control points (normalized 0-1)
  const [p1, setP1] = useState<Point>({ x: 0.25, y: 0.1 });
  const [p2, setP2] = useState<Point>({ x: 0.25, y: 1 });
  const [dragging, setDragging] = useState<'p1' | 'p2' | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationProgress, setAnimationProgress] = useState(0);

  const canvasSize = 220;
  const padding = 20;
  const graphSize = canvasSize - padding * 2;

  // Convert normalized coords to canvas coords
  const toCanvas = useCallback((point: Point): Point => ({
    x: padding + point.x * graphSize,
    y: canvasSize - padding - point.y * graphSize,
  }), [graphSize]);

  // Convert canvas coords to normalized
  const fromCanvas = useCallback((x: number, y: number): Point => ({
    x: Math.max(0, Math.min(1, (x - padding) / graphSize)),
    y: Math.max(-0.5, Math.min(1.5, (canvasSize - padding - y) / graphSize)),
  }), [graphSize]);

  // Cubic bezier calculation
  const cubicBezier = useCallback((t: number): number => {
    const p0 = { x: 0, y: 0 };
    const p3 = { x: 1, y: 1 };
    
    // Solve for t given x (iterative approach)
    const cx = 3 * p1.x;
    const bx = 3 * (p2.x - p1.x) - cx;
    const ax = 1 - cx - bx;
    
    const cy = 3 * p1.y;
    const by = 3 * (p2.y - p1.y) - cy;
    const ay = 1 - cy - by;
    
    return ((ay * t + by) * t + cy) * t;
  }, [p1, p2]);

  // Draw the curve
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasSize, canvasSize);

    // Grid
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 4]);
    
    for (let i = 0; i <= 4; i++) {
      const pos = padding + (graphSize * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pos, padding);
      ctx.lineTo(pos, canvasSize - padding);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padding, pos);
      ctx.lineTo(canvasSize - padding, pos);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Axis box
    ctx.strokeStyle = 'hsl(var(--border))';
    ctx.lineWidth = 1;
    ctx.strokeRect(padding, padding, graphSize, graphSize);

    // Control point handles (lines from endpoints)
    ctx.strokeStyle = 'hsl(var(--muted-foreground))';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    
    const p0Canvas = toCanvas({ x: 0, y: 0 });
    const p1Canvas = toCanvas(p1);
    const p2Canvas = toCanvas(p2);
    const p3Canvas = toCanvas({ x: 1, y: 1 });

    ctx.beginPath();
    ctx.moveTo(p0Canvas.x, p0Canvas.y);
    ctx.lineTo(p1Canvas.x, p1Canvas.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(p3Canvas.x, p3Canvas.y);
    ctx.lineTo(p2Canvas.x, p2Canvas.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Bezier curve
    ctx.strokeStyle = 'hsl(32, 65%, 55%)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(p0Canvas.x, p0Canvas.y);
    ctx.bezierCurveTo(
      p1Canvas.x, p1Canvas.y,
      p2Canvas.x, p2Canvas.y,
      p3Canvas.x, p3Canvas.y
    );
    ctx.stroke();

    // Control points
    const drawControlPoint = (point: Point, isP1: boolean) => {
      const canvasPoint = toCanvas(point);
      const isActive = (isP1 && dragging === 'p1') || (!isP1 && dragging === 'p2');
      
      // Outer glow
      ctx.fillStyle = isP1 ? 'hsl(160, 60%, 50%)' : 'hsl(280, 55%, 60%)';
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(canvasPoint.x, canvasPoint.y, isActive ? 14 : 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Main circle
      ctx.fillStyle = isP1 ? 'hsl(160, 60%, 50%)' : 'hsl(280, 55%, 60%)';
      ctx.beginPath();
      ctx.arc(canvasPoint.x, canvasPoint.y, isActive ? 8 : 6, 0, Math.PI * 2);
      ctx.fill();

      // Inner dot
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(canvasPoint.x, canvasPoint.y, 2, 0, Math.PI * 2);
      ctx.fill();
    };

    drawControlPoint(p1, true);
    drawControlPoint(p2, false);

    // Animation progress indicator
    if (isAnimating) {
      const progressX = padding + animationProgress * graphSize;
      const progressY = canvasSize - padding - cubicBezier(animationProgress) * graphSize;

      ctx.fillStyle = 'hsl(32, 65%, 55%)';
      ctx.shadowColor = 'hsl(32, 65%, 55%)';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(progressX, progressY, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

  }, [p1, p2, dragging, toCanvas, isAnimating, animationProgress, cubicBezier, graphSize]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const p1Canvas = toCanvas(p1);
    const p2Canvas = toCanvas(p2);

    const dist1 = Math.sqrt((x - p1Canvas.x) ** 2 + (y - p1Canvas.y) ** 2);
    const dist2 = Math.sqrt((x - p2Canvas.x) ** 2 + (y - p2Canvas.y) ** 2);

    if (dist1 < 15) {
      setDragging('p1');
    } else if (dist2 < 15) {
      setDragging('p2');
    }
  }, [p1, p2, toCanvas]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newPoint = fromCanvas(x, y);

    if (dragging === 'p1') {
      setP1(newPoint);
    } else {
      setP2(newPoint);
    }
  }, [dragging, fromCanvas]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  // Play animation preview
  const playAnimation = useCallback(() => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setAnimationProgress(0);
    
    const duration = 1500;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      setAnimationProgress(progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => {
          setIsAnimating(false);
          setAnimationProgress(0);
        }, 500);
      }
    };
    
    requestAnimationFrame(animate);
  }, [isAnimating]);

  // Apply preset
  const applyPreset = useCallback((name: string) => {
    const [x1, y1, x2, y2] = presets[name];
    setP1({ x: x1, y: y1 });
    setP2({ x: x2, y: y2 });
  }, []);

  // Format CSS output
  const cssOutput = `cubic-bezier(${p1.x.toFixed(2)}, ${p1.y.toFixed(2)}, ${p2.x.toFixed(2)}, ${p2.y.toFixed(2)})`;

  return (
    <div className={`bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 ${className}`} ref={containerRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-mono text-[10px] text-muted-foreground uppercase tracking-widest">
          Bezier Editor
        </span>
        <motion.button
          onClick={playAnimation}
          disabled={isAnimating}
          className="text-mono text-[10px] px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isAnimating ? 'Playing...' : 'Preview'}
        </motion.button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full rounded-lg cursor-crosshair"
        style={{ touchAction: 'none' }}
      />

      {/* Animation preview bar */}
      <div className="mt-3 h-8 bg-background/50 rounded-lg overflow-hidden relative border border-border/30">
        <motion.div
          className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-primary shadow-lg"
          animate={{
            left: isAnimating ? `calc(${cubicBezier(animationProgress) * 100}% - 10px)` : '4px',
          }}
          transition={{ duration: 0, ease: 'linear' }}
        />
        <div className="absolute inset-0 flex items-center justify-between px-2 pointer-events-none">
          <span className="text-mono text-[9px] text-muted-foreground/50">0</span>
          <span className="text-mono text-[9px] text-muted-foreground/50">1</span>
        </div>
      </div>

      {/* Control point values */}
      <div className="grid grid-cols-2 gap-2 mt-3">
        <div className="flex items-center gap-2 text-[10px]">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(160, 60%, 50%)' }} />
          <span className="text-muted-foreground">P1:</span>
          <span className="text-mono text-foreground">{p1.x.toFixed(2)}, {p1.y.toFixed(2)}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'hsl(280, 55%, 60%)' }} />
          <span className="text-muted-foreground">P2:</span>
          <span className="text-mono text-foreground">{p2.x.toFixed(2)}, {p2.y.toFixed(2)}</span>
        </div>
      </div>

      {/* CSS output */}
      <div className="mt-3 p-2 bg-background/80 rounded-lg border border-border/30">
        <code className="text-mono text-[10px] text-primary break-all">{cssOutput}</code>
      </div>

      {/* Presets */}
      <div className="mt-3">
        <span className="text-mono text-[9px] text-muted-foreground uppercase tracking-widest mb-2 block">
          Presets
        </span>
        <div className="flex flex-wrap gap-1">
          {Object.keys(presets).map((name) => (
            <motion.button
              key={name}
              onClick={() => applyPreset(name)}
              className="text-mono text-[9px] px-2 py-1 rounded-full border border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {name}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BezierCurveEditor;
