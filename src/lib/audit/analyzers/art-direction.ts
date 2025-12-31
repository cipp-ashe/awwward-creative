/**
 * Art Direction Analyzer
 * Focus: Cohesion. Is this brutalist, minimalist, or corporate? Mixed = failure.
 * 
 * NOTE: This project uses an intentional "editorial hybrid" aesthetic that combines
 * ethereal glow effects with brutalist typography for tension. This is documented
 * in the project manifesto and is not flagged as a conflict.
 */

import type { FrictionPoint, FileContents } from '../types';
import { 
  OPACITY_MODIFIER, 
  HARDCODED_COLOR,
} from '../pattern-matchers';

export const analyzeArtDirection = (files: FileContents): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];
  
  const indexCss = files['src/index.css'] || '';
  const tailwindConfig = files['tailwind.config.ts'] || '';
  
  // Detect editorial hybrid aesthetic (intentional mixing per project manifesto)
  const hasGrainOverlay = Object.keys(files).some(path => path.includes('GrainOverlay'));
  const hasWebGL = Object.keys(files).some(path => path.includes('WebGL'));
  const isEditorialHybrid = hasGrainOverlay && hasWebGL;
  
  // Check for glow effects (suggests soft/dreamy aesthetic)
  const hasGlowEffects = Object.entries(files).some(([path, content]) => 
    path.endsWith('.tsx') && /glow|blur-|shadow-.*glow/i.test(content)
  );
  
  // Check for brutalist elements (sharp edges, monospace, raw)
  const hasBrutalistElements = 
    /font-mono|JetBrains|monospace/i.test(tailwindConfig) ||
    Object.values(files).some(content => /font-mono|tracking-tight/i.test(content));
  
  // Check for film grain or analog textures
  const hasAnalogTextures = Object.entries(files).some(([path, content]) => 
    /grain|noise|texture|film/i.test(path) || /grain|noise|texture/i.test(content)
  );
  
  // Check for WebGL/digital-first elements
  const hasDigitalElements = Object.entries(files).some(([path, content]) =>
    /webgl|three|canvas|shader/i.test(path) || /WebGL|Three|Canvas|<Canvas/i.test(content)
  );
  
  // Detect aesthetic conflicts - skip if editorial hybrid is intentional
  if (hasGlowEffects && hasBrutalistElements && !isEditorialHybrid) {
    issues.push({
      persona: 'art-direction',
      issue: 'Glow/blur effects conflict with brutalist typography (monospace, tight tracking). Direction unclear: ethereal or utilitarian?',
      severity: 'high',
      conflictsWith: ['typography'],
    });
  }
  
  // Editorial hybrid intentionally mixes analog + digital for nostalgic-futuristic tension
  if (hasAnalogTextures && hasDigitalElements && !isEditorialHybrid) {
    issues.push({
      persona: 'art-direction',
      issue: 'Film grain/analog textures contradict WebGL/digital-first backgrounds. Nostalgic or futuristic? Pick one.',
      severity: 'medium',
    });
  }
  
  // Check for inconsistent opacity usage on primary colors
  // Allow up to 5 semantic opacity values (10, 20, 40, 60, 80) before flagging
  const opacityMatches: { file: string; opacity: string }[] = [];
  Object.entries(files).forEach(([path, content]) => {
    if (path.endsWith('.tsx')) {
      let match;
      const regex = new RegExp(OPACITY_MODIFIER.source, 'gi');
      while ((match = regex.exec(content)) !== null) {
        opacityMatches.push({ file: path, opacity: match[1] });
      }
    }
  });
  
  // If more than 5 different opacity values, flag as inconsistent
  const uniqueOpacities = [...new Set(opacityMatches.map(m => m.opacity))];
  if (uniqueOpacities.length > 5) {
    issues.push({
      persona: 'art-direction',
      issue: `Primary color uses ${uniqueOpacities.length} different opacity values (${uniqueOpacities.slice(0, 4).join(', ')}...). Opacity modulation masks weak color hierarchy.`,
      severity: 'high',
    });
  }
  
  // Check for hardcoded colors bypassing design system
  const hardcodedColorFiles: string[] = [];
  Object.entries(files).forEach(([path, content]) => {
    // Skip CSS files (they define the design system)
    if (path.endsWith('.css')) return;
    // Skip chart.tsx (recharts library requires hardcoded colors for theming)
    if (path.includes('chart.tsx')) return;
    // Skip test files
    if (path.includes('.test.') || path.includes('.spec.')) return;
    
    if (path.endsWith('.tsx') && HARDCODED_COLOR.test(content)) {
      hardcodedColorFiles.push(path);
    }
  });
  
  if (hardcodedColorFiles.length > 0) {
    issues.push({
      persona: 'art-direction',
      issue: `Hardcoded colors bypass design system in: ${hardcodedColorFiles.slice(0, 3).join(', ')}${hardcodedColorFiles.length > 3 ? ` (+${hardcodedColorFiles.length - 3} more)` : ''}. Use semantic tokens.`,
      severity: 'medium',
    });
  }
  
  // Check if CSS variables are defined in index.css
  const hasThemeVariables = /--primary:|--secondary:|--background:|--foreground:/i.test(indexCss);
  if (!hasThemeVariables) {
    issues.push({
      persona: 'art-direction',
      issue: 'No CSS custom properties for theme colors in index.css. Design system lacks foundation.',
      severity: 'critical',
    });
  }
  
  return issues;
};
