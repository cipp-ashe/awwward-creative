import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const PerformanceSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stats counter animation
      const stats = statsRef.current?.querySelectorAll('.stat-value');
      stats?.forEach((stat) => {
        const target = parseInt(stat.getAttribute('data-value') || '0');
        gsap.from(stat, {
          scrollTrigger: {
            trigger: stat,
            start: 'top 80%',
            toggleActions: 'play none none reverse',
          },
          textContent: 0,
          duration: 2,
          ease: 'power2.out',
          snap: { textContent: 1 },
          onUpdate: function() {
            const current = Math.round(gsap.getProperty(stat, 'textContent') as number);
            stat.textContent = current.toString();
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const principles = [
    { icon: '⚡', title: 'GPU-only Transforms', desc: 'translate, scale, rotate, opacity — nothing else touches the main thread' },
    { icon: '📦', title: 'Code Splitting', desc: 'WebGL scenes load on demand, keeping initial bundle under 100kb' },
    { icon: '🎯', title: 'Perceived Speed', desc: 'Skeleton screens and progressive hydration make load feel instant' },
    { icon: '♿', title: 'Graceful Fallback', desc: 'Reduced motion support and simplified visuals for lower-powered devices' },
  ];

  return (
    <section ref={sectionRef} className="section py-32 md:py-48 relative">
      <div className="section-content">
        <span className="text-mono text-xs text-primary tracking-widest uppercase mb-8 block">
          05 — Performance
        </span>

        <div className="grid md:grid-cols-2 gap-12 md:gap-24 items-start mb-24">
          <div>
            <h2 className="text-display text-display-md mb-6">
              Speed is a <span className="text-primary">feature</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Beautiful motion means nothing if it stutters. Performance isn't 
              a Lighthouse score — it's the feeling of control.
            </p>
          </div>

          <div ref={statsRef} className="grid grid-cols-2 gap-8">
            <div className="text-center p-6 border border-border/30 rounded-lg">
              <div className="stat-value text-display text-display-sm text-primary" data-value="60">0</div>
              <div className="text-mono text-xs text-muted-foreground mt-2">FPS Target</div>
            </div>
            <div className="text-center p-6 border border-border/30 rounded-lg">
              <div className="stat-value text-display text-display-sm text-primary" data-value="16">0</div>
              <div className="text-mono text-xs text-muted-foreground mt-2">ms Frame Budget</div>
            </div>
            <div className="text-center p-6 border border-border/30 rounded-lg">
              <div className="stat-value text-display text-display-sm text-primary" data-value="100">0</div>
              <div className="text-mono text-xs text-muted-foreground mt-2">kb Initial JS</div>
            </div>
            <div className="text-center p-6 border border-border/30 rounded-lg">
              <div className="text-display text-display-sm text-primary">0</div>
              <div className="text-mono text-xs text-muted-foreground mt-2">Layout Shifts</div>
            </div>
          </div>
        </div>

        {/* Principles grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {principles.map((principle, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="flex gap-4 p-6 bg-card/20 rounded-lg border border-border/30"
            >
              <span className="text-2xl">{principle.icon}</span>
              <div>
                <h3 className="text-display text-base mb-2">{principle.title}</h3>
                <p className="text-sm text-muted-foreground">{principle.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PerformanceSection;
