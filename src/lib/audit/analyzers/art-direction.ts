/**
 * Art Direction Analyzer
 * Focus: Cohesion. Is this brutalist, minimalist, or corporate? Mixed = failure.
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
  
  // Detect aesthetic conflicts
  if (hasGlowEffects && hasBrutalistElements) {
    issues.push({
      persona: 'art-direction',
      issue: 'Glow/blur effects conflict with brutalist typography (monospace, tight tracking). Direction unclear: ethereal or utilitarian?',
      severity: 'high',
      conflictsWith: ['typography'],
    });
  }
  
  if (hasAnalogTextures && hasDigitalElements) {
    issues.push({
      persona: 'art-direction',
      issue: 'Film grain/analog textures contradict WebGL/digital-first backgrounds. Nostalgic or futuristic? Pick one.',
      severity: 'medium',
    });
  }
  
  // Check for inconsistent opacity usage on primary colors
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
  
  // If more than 3 different opacity values, flag as inconsistent
  const uniqueOpacities = [...new Set(opacityMatches.map(m => m.opacity))];
  if (uniqueOpacities.length > 3) {
    issues.push({
      persona: 'art-direction',
      issue: `Primary color uses ${uniqueOpacities.length} different opacity values (${uniqueOpacities.slice(0, 4).join(', ')}...). Opacity modulation masks weak color hierarchy.`,
      severity: 'high',
    });
  }
  
  // Check for hardcoded colors bypassing design system
  const hardcodedColorFiles: string[] = [];
  Object.entries(files).forEach(([path, content]) => {
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
