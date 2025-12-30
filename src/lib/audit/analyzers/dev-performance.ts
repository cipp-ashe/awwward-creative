/**
 * Dev/Performance Analyzer
 * Focus: DOM complexity, heavy assets, bundle size implications.
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
  
  if (usedLibraries.length >= 4) {
    issues.push({
      persona: 'dev-performance',
      issue: `${usedLibraries.length} animation/3D libraries detected (${usedLibraries.map(l => l.name).join(', ')}). Bundle size likely > 200KB before application code. Verify tree-shaking effectiveness.`,
      severity: 'critical',
    });
  } else if (usedLibraries.length >= 3) {
    issues.push({
      persona: 'dev-performance',
      issue: `${usedLibraries.length} animation libraries (${usedLibraries.map(l => l.name).join(', ')}). Consider consolidating or lazy-loading non-critical ones.`,
      severity: 'high',
    });
  }
  
  // Check for useState in RAF/animation contexts (anti-pattern)
  // But exclude files that properly use refs for high-frequency values
  const rafStateFiles: string[] = [];
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.tsx') || path.endsWith('.ts')) {
      // Check if file has both RAF/useFrame and setState patterns
      const hasRAF = RAF_USAGE.test(content) || USE_FRAME.test(content) || /onUpdate|ticker\.add/i.test(content);
      RAF_USAGE.lastIndex = 0;
      USE_FRAME.lastIndex = 0;
      
      const hasStateUpdate = /set[A-Z][a-zA-Z]*\s*\(/g.test(content) && USESTATE_PATTERN.test(content);
      USESTATE_PATTERN.lastIndex = 0;
      
      // Check if refs are used for the high-frequency values (mitigates the issue)
      const usesRefsForAnimation = /useRef.*\.current\s*=/i.test(content) || 
                                    /ref\.current\s*=/i.test(content) ||
                                    /\.current\s*=\s*[^=]/i.test(content);
      
      // Only flag if no ref mitigation is present
      if (hasRAF && hasStateUpdate && !usesRefsForAnimation) {
        rafStateFiles.push(path);
      }
    }
  });
  
  if (rafStateFiles.length > 0) {
    issues.push({
      persona: 'dev-performance',
      issue: `RAF/animation frame state updates without ref mitigation in: ${rafStateFiles.map(f => f.split('/').pop()).join(', ')}. State updates trigger re-renders. Use refs for high-frequency values.`,
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
  
  const hasFontPreload = /rel=["']preload["'][^>]*as=["']font["']/i.test(indexHtml);
  const hasFontDisplay = /font-display:\s*(?:swap|optional)/i.test(indexCss);
  
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
