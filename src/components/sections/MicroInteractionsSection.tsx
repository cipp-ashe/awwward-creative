/**
 * MicroInteractionsSection
 * 
 * Demonstrates hover effects, magnetic pulls, and spring physics.
 */

import { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { Section, SectionLabel } from '@/components/layout/Section';
import ScrollReveal, { StaggerContainer, StaggerItem } from '@/components/ScrollReveal';
import { DELAY, STAGGER, TRANSITION, DURATION } from '@/constants/animation';

const MicroInteractionsSection = () => {
  return (
    <Section id="micro">
      <ScrollReveal variant="fadeUp">
        <SectionLabel className="mb-8 block">04 — Micro-interactions</SectionLabel>
      </ScrollReveal>

      <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-start mb-24">
        <div>
          <ScrollReveal variant="slideUp" delay={DELAY.micro}>
            <h2 className="text-display text-display-md mb-6">
              Details imply <span className="text-primary">depth</span>
            </h2>
          </ScrollReveal>
          <ScrollReveal variant="fadeUp" delay={DELAY.xshort}>
            <p className="text-lg text-muted-foreground">
              Micro-interactions suggest a world beyond the screen. Hover states, 
              cursor trails, and subtle physics create the illusion of materiality.
            </p>
          </ScrollReveal>
        </div>

        <StaggerContainer staggerDelay={STAGGER.wide} className="text-muted-foreground space-y-6">
          <StaggerItem>
            <p>
              These small moments of feedback tell users the interface is alive 
              and listening. They transform clicking into touching, scrolling 
              into gliding.
            </p>
          </StaggerItem>
          <StaggerItem>
            <p className="text-mono text-sm border-l-2 border-primary/30 pl-4 py-2">
              "requestAnimationFrame loops for cursor-follow and inertia-based micro-interactions"
            </p>
          </StaggerItem>
        </StaggerContainer>
      </div>

      {/* Interactive demo area */}
      <StaggerContainer staggerDelay={STAGGER.normal} className="grid md:grid-cols-3 gap-6 md:gap-8">
        <StaggerItem variant="scale">
          <MagneticCard 
            title="Magnetic Pull" 
            description="Elements that follow the cursor create a sense of connection and agency." 
          />
        </StaggerItem>
        <StaggerItem variant="scale">
          <TiltCard 
            title="3D Tilt" 
            description="Perspective transforms suggest depth and physicality in a flat medium." 
          />
        </StaggerItem>
        <StaggerItem variant="scale">
          <SpringCard 
            title="Spring Physics" 
            description="Natural motion curves make interactions feel organic and inevitable." 
          />
        </StaggerItem>
      </StaggerContainer>
    </Section>
  );
};

// ============================================================================
// INTERACTIVE CARD COMPONENTS
// ============================================================================

interface CardProps {
  title: string;
  description: string;
}

const MagneticCard = ({ title, description }: CardProps) => {
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

const TiltCard = ({ title, description }: CardProps) => {
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

const SpringCard = ({ title, description }: CardProps) => {
  const scale = useMotionValue(1);
  const springScale = useSpring(scale, { stiffness: 400, damping: 17 });

  return (
    <motion.div
      onMouseDown={() => scale.set(0.95)}
      onMouseUp={() => scale.set(1)}
      onMouseLeave={() => scale.set(1)}
      style={{ scale: springScale }}
      whileHover={{ y: -5 }}
      transition={TRANSITION.bounce}
      className="group p-8 bg-card/30 border border-border/50 rounded-lg hover:border-primary/30 transition-colors duration-500 cursor-pointer"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
        <motion.div
          animate={{ rotate: [0, 15, -15, 0] }}
          transition={{ duration: DURATION.pulse * 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-3 h-3 bg-primary rounded-sm"
        />
      </div>
      <h3 className="text-display text-lg mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </motion.div>
  );
};

export default MicroInteractionsSection;
