import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

const MicroInteractionsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <section className="section py-32 md:py-48">
      <div className="section-content">
        <span className="text-mono text-xs text-primary tracking-widest uppercase mb-8 block">
          04 — Micro-interactions
        </span>

        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-start mb-24">
          <div>
            <h2 className="text-display text-display-md mb-6">
              Details imply <span className="text-primary">depth</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Micro-interactions suggest a world beyond the screen. Hover states, 
              cursor trails, and subtle physics create the illusion of materiality.
            </p>
          </div>

          <div className="text-muted-foreground space-y-6">
            <p>
              These small moments of feedback tell users the interface is alive 
              and listening. They transform clicking into touching, scrolling 
              into gliding.
            </p>
            <p className="text-mono text-sm border-l-2 border-primary/30 pl-4 py-2">
              "requestAnimationFrame loops for cursor-follow and inertia-based micro-interactions"
            </p>
          </div>
        </div>

        {/* Interactive demo area */}
        <div ref={containerRef} className="grid md:grid-cols-3 gap-6 md:gap-8">
          <MagneticCard title="Magnetic Pull" description="Elements that follow the cursor create a sense of connection and agency." />
          <TiltCard title="3D Tilt" description="Perspective transforms suggest depth and physicality in a flat medium." />
          <SpringCard title="Spring Physics" description="Natural motion curves make interactions feel organic and inevitable." />
        </div>
      </div>
    </section>
  );
};

const MagneticCard = ({ title, description }: { title: string; description: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 15 });
  const springY = useSpring(y, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * 0.15;
    const deltaY = (e.clientY - centerY) * 0.15;
    x.set(deltaX);
    y.set(deltaY);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className="group p-8 bg-card/30 border border-border/50 rounded-lg hover:border-primary/30 transition-colors duration-500 cursor-pointer"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
        <div className="w-2 h-2 rounded-full bg-primary" />
      </div>
      <h3 className="text-display text-lg mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
};

const TiltCard = ({ title, description }: { title: string; description: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotX = ((y - centerY) / centerY) * -10;
    const rotY = ((x - centerX) / centerX) * 10;
    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ rotateX, rotateY }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
      className="group p-8 bg-card/30 border border-border/50 rounded-lg hover:border-primary/30 transition-colors duration-500 cursor-pointer"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
        <div className="w-3 h-3 border-2 border-primary rounded-sm" />
      </div>
      <h3 className="text-display text-lg mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
};

const SpringCard = ({ title, description }: { title: string; description: string }) => {
  const scale = useMotionValue(1);
  const springScale = useSpring(scale, { stiffness: 400, damping: 17 });

  return (
    <motion.div
      onMouseDown={() => scale.set(0.95)}
      onMouseUp={() => scale.set(1)}
      onMouseLeave={() => scale.set(1)}
      style={{ scale: springScale }}
      whileHover={{ y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group p-8 bg-card/30 border border-border/50 rounded-lg hover:border-primary/30 transition-colors duration-500 cursor-pointer"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-3 h-3 bg-primary rounded-sm"
        />
      </div>
      <h3 className="text-display text-lg mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
};

export default MicroInteractionsSection;
