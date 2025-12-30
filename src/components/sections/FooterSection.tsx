/**
 * FooterSection
 * 
 * Site footer with closing statement and marquee animation.
 */

import { motion } from 'framer-motion';
import { Section, SectionContent } from '@/components/layout/Section';

const FooterSection = () => {
  return (
    <footer className="py-32 md:py-48 relative overflow-hidden">
      <SectionContent>
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="text-center mb-16"
        >
          <h2 className="text-display text-display-lg mb-8">
            Built with <span className="text-primary">intent</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-balance">
            This is not a clone of any specific site, but a synthesis of modern 
            creative web patterns executed with discipline.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.3 }}
          className="border-t border-border/30 pt-12"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-mono text-xs text-muted-foreground">
              An experimental demonstrator of Awwwards-style web principles
            </div>

            <div className="flex items-center gap-8">
              <span className="text-mono text-xs text-muted-foreground">
                GSAP • Lenis • Three.js • Framer Motion
              </span>
            </div>
          </div>
        </motion.div>

        {/* Large decorative text */}
        <div className="mt-24 overflow-hidden opacity-[0.03]">
          <motion.div
            animate={{ x: [0, -1000] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="whitespace-nowrap"
          >
            <span className="text-[20vw] font-display font-bold tracking-tighter">
              MOTION • SCROLL • TYPE • DEPTH • MOTION • SCROLL • TYPE • DEPTH •{' '}
            </span>
          </motion.div>
        </div>
      </SectionContent>

      {/* Glow */}
      <div className="glow w-[800px] h-[800px] -bottom-1/2 left-1/2 -translate-x-1/2" />
    </footer>
  );
};

export default FooterSection;
