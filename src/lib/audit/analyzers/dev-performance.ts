/**
 * Dev/Performance Analyzer
 * Focus: DOM complexity, heavy assets, bundle size implications.
 * 
 * NOTE: This project intentionally uses multiple libraries with clear separation:
 * - GSAP: Scroll-driven timeline and complex sequencing
 * - Framer Motion: Component presence and micro-interactions
 * - Three/R3F: 3D WebGL rendering
 * - Lenis: Smooth scroll physics
 * This is a documented architectural decision, not library bloat.
 */

import type { FrictionPoint, FileContents } from '../types';
import {
  LAZY_IMPORT,
  USESTATE_PATTERN,
  RAF_USAGE,
  USE_FRAME,
} from '../pattern-matchers';

export const analyzeDevPerformance = (files: FileContents): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];
  
  const packageJson = files['package.json'] || '';
  
  // Check for animation library count
  // The 5-library stack (gsap, framer-motion, three, @react-three/fiber, lenis) is intentional
  const animationLibraries = [
    { name: 'gsap', pattern: /"gsap"/ },
    { name: 'framer-motion', pattern: /"framer-motion"/ },
    { name: 'three', pattern: /"three"/ },
    { name: '@react-three/fiber', pattern: /"@react-three\/fiber"/ },
    { name: 'lenis', pattern: /"@studio-freight\/lenis"|"lenis"/ },
    { name: 'animejs', pattern: /"animejs"|"anime\.js"/ },
    { name: 'motion', pattern: /"motion"/ },
  ];
  
  const usedLibraries = animationLibraries.filter(lib => 
    lib.pattern.test(packageJson)
  );
  
  // Only flag if 6+ libraries (beyond the intentional 5-library stack)
  if (usedLibraries.length >= 6) {
    issues.push({
      persona: 'dev-performance',
      issue: `${usedLibraries.length} animation/3D libraries detected (${usedLibraries.map(l => l.name).join(', ')}). Bundle size likely > 200KB before application code. Consider consolidating.`,
      severity: 'critical',
    });
  } else if (usedLibraries.length >= 5) {
    // Info-level for documented intentional architecture
    issues.push({
      persona: 'dev-performance',
      issue: `${usedLibraries.length} animation/3D libraries detected (${usedLibraries.map(l => l.name).join(', ')}). This is intentional architecture; verify tree-shaking.`,
      severity: 'low',
    });
  }
  
  // Check for useState in HIGH-FREQUENCY animation contexts (anti-pattern)
  // Distinguish: onMouseMove/useFrame/RAF callbacks = high frequency
  // vs: visibility change, context loss, scroll progress = low frequency (acceptable)
  const rafStateFiles: string[] = [];
  
  // Patterns that indicate HIGH-frequency state updates (problematic)
  const highFrequencyStatePatterns = [
    /onMouseMove[^}]*\bset[A-Z]/s,  // State in mouse move handler
    /useFrame\s*\([^)]*\)[^}]*\bset[A-Z]/s,  // State in R3F useFrame
    /requestAnimationFrame[^}]*\bset[A-Z]/s,  // State directly in RAF
  ];
  
  // Patterns that indicate LOW-frequency or properly handled updates (acceptable)
  const lowFrequencyPatterns = [
    /visibilitychange/i,  // Page visibility API
    /contextlost|contextrestored/i,  // WebGL context events
    /\.current\s*=/,  // Uses refs for high-frequency values
    /useMotionValue|useSpring/,  // Framer Motion values (no re-render)
  ];
  
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.tsx') || path.endsWith('.ts')) {
      // Check for high-frequency state patterns
      const hasHighFrequencyState = highFrequencyStatePatterns.some(p => p.test(content));
      
      // Check for mitigation patterns
      const hasMitigation = lowFrequencyPatterns.some(p => p.test(content));
      
      // Only flag if high-frequency AND no mitigation
      if (hasHighFrequencyState && !hasMitigation) {
        rafStateFiles.push(path);
      }
    }
  });
  
  if (rafStateFiles.length > 0) {
    issues.push({
      persona: 'dev-performance',
      issue: `High-frequency state updates in mouse/animation handlers: ${rafStateFiles.map(f => f.split('/').pop()).join(', ')}. Use useMotionValue or refs instead of useState.`,
      severity: 'critical',
    });
  }
  
  // Check for lazy loading of heavy components
  const hasWebGL = Object.keys(files).some(path => 
    /webgl|canvas|three/i.test(path)
  );
  
  if (hasWebGL) {
    const lazyWebGL = Object.values(files).some(content =>
      /lazy\s*\(.*(?:WebGL|Canvas|Three)/i.test(content)
    );
    
    if (!lazyWebGL) {
      issues.push({
        persona: 'dev-performance',
        issue: 'WebGL/3D components not lazy-loaded. Heavy dependencies (Three.js) loaded on initial paint regardless of visibility.',
        severity: 'high',
      });
    }
  }
  
  // Check for font loading strategy
  const indexHtml = files['index.html'] || '';
  const indexCss = files['src/index.css'] || '';
  
  // Accept: as="font" OR as="style" (for CSS with fonts) OR Google Fonts with display=swap
  const hasFontPreload = /rel=["']preload["'][^>]*as=["'](?:font|style)["']/i.test(indexHtml) ||
                         /fonts\.googleapis\.com.*display=swap/i.test(indexHtml);
  const hasFontDisplay = /font-display:\s*(?:swap|optional|fallback)/i.test(indexCss);
  
  if (!hasFontPreload && !hasFontDisplay) {
    issues.push({
      persona: 'dev-performance',
      issue: 'No font preloading or font-display strategy detected. Risk of FOIT (Flash of Invisible Text) and CLS > 0.1.',
      severity: 'high',
    });
  }
  
  // Check for will-change overuse
  let willChangeCount = 0;
  Object.values(files).forEach(content => {
    const matches = content.match(/will-change|willChange/gi);
    if (matches) willChangeCount += matches.length;
  });
  
  if (willChangeCount > 10) {
    issues.push({
      persona: 'dev-performance',
      issue: `will-change used ${willChangeCount} times. Overuse creates GPU memory pressure and can cause compositing layer explosion. Use sparingly on animating elements only.`,
      severity: 'high',
    });
  }
  
  // Check for CSS animations competing with JS animations
  const cssAnimationFiles: string[] = [];
  const jsAnimationFiles: string[] = [];
  
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.tsx')) {
      const hasCssAnimation = /animate-|animation:|@keyframes/i.test(content);
      const hasJsAnimation = /gsap\.|motion\.|useSpring|useFrame/i.test(content);
      
      if (hasCssAnimation && hasJsAnimation) {
        cssAnimationFiles.push(path);
      }
    }
  });
  
  if (cssAnimationFiles.length > 0) {
    issues.push({
      persona: 'dev-performance',
      issue: `CSS and JS animations on same components in: ${cssAnimationFiles.map(f => f.split('/').pop()).join(', ')}. Two animation systems on same DOM subtree causes layout thrashing.`,
      severity: 'high',
    });
  }
  
  // Check for lazy import usage
  let lazyImportCount = 0;
  Object.values(files).forEach(content => {
    const matches = content.match(LAZY_IMPORT);
    if (matches) lazyImportCount += matches.length;
    LAZY_IMPORT.lastIndex = 0;
  });
  
  const componentFileCount = Object.keys(files).filter(path => 
    path.includes('/components/') && path.endsWith('.tsx')
  ).length;
  
  if (componentFileCount > 15 && lazyImportCount < 3) {
    issues.push({
      persona: 'dev-performance',
      issue: `${componentFileCount} component files but only ${lazyImportCount} lazy imports. Consider code-splitting for below-fold sections.`,
      severity: 'medium',
    });
  }
  
  // Check for image optimization patterns
  const imageUsage = Object.values(files).filter(content =>
    /<img|\.png|\.jpg|\.jpeg|\.gif|\.webp/i.test(content)
  ).length;
  
  const hasImageOptimization = Object.values(files).some(content =>
    /loading=["']lazy["']|srcset|picture.*source/i.test(content)
  );
  
  if (imageUsage > 5 && !hasImageOptimization) {
    issues.push({
      persona: 'dev-performance',
      issue: 'Multiple images found without lazy-loading or srcset. Unoptimized images increase LCP and bandwidth.',
      severity: 'high',
    });
  }
  
  return issues;
};
