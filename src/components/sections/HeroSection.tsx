import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const scrollIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Title animation on scroll
      gsap.to(titleRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1,
        },
        y: -100,
        opacity: 0.3,
        scale: 0.9,
      });

      // Subtitle parallax
      gsap.to(subtitleRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.5,
        },
        y: -50,
        opacity: 0,
      });

      // Scroll indicator fade
      gsap.to(scrollIndicatorRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: '10% top',
          end: '30% top',
          scrub: true,
        },
        opacity: 0,
        y: 20,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const titleWords = ['Disciplined', 'misuse', 'of very good', 'primitives'];

  return (
    <section
      ref={sectionRef}
      className="section min-h-screen flex flex-col justify-center items-center relative overflow-hidden"
    >
      <div className="section-content text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.2 }}
          className="mb-8 md:mb-12"
        >
          <span className="text-mono text-xs md:text-sm text-muted-foreground tracking-widest uppercase">
            An experimental demonstrator
          </span>
        </motion.div>

        <h1 ref={titleRef} className="text-display text-display-xl mb-8 md:mb-12">
          {titleWords.map((word, index) => (
            <motion.span
              key={index}
              initial={{ opacity: 0, y: 80, rotateX: -90 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{
                duration: 1,
                delay: 0.3 + index * 0.15,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`inline-block mr-[0.25em] ${
                word === 'misuse' ? 'text-primary italic' : ''
              }`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          ref={subtitleRef}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-balance"
        >
          A synthesis of modern creative web patterns — motion, scroll, typography, 
          and performance working together to communicate taste, intent, and technical fluency.
        </motion.p>
      </div>

      {/* Decorative elements */}
      <div className="glow w-[600px] h-[600px] -bottom-1/2 left-1/2 -translate-x-1/2 animate-pulse-glow" />

      {/* Scroll indicator */}
      <motion.div
        ref={scrollIndicatorRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
      >
        <span className="text-mono text-xs text-muted-foreground tracking-widest uppercase">
          Scroll
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="w-px h-12 bg-gradient-to-b from-primary/50 to-transparent"
        />
      </motion.div>
    </section>
  );
};

export default HeroSection;
