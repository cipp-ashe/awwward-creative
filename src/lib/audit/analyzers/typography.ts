/**
 * Typography Analyzer
 * Focus: hierarchy, leading, kerning, rhythmic vertical rhythm.
 */

import type { FrictionPoint, FileContents } from '../types';

export const analyzeTypography = (files: FileContents): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];
  
  const tailwindConfig = files['tailwind.config.ts'] || '';
  
  // Parse clamp() values from tailwind config
  const clampRegex = /clamp\(([^,]+),\s*([^,]+),\s*([^)]+)\)/g;
  const clampMatches: { min: string; max: string; ratio: number }[] = [];
  
  let match;
  while ((match = clampRegex.exec(tailwindConfig)) !== null) {
    const [, min, , max] = match;
    const minVal = parseFloat(min);
    const maxVal = parseFloat(max);
    
    if (!isNaN(minVal) && !isNaN(maxVal) && minVal > 0) {
      const ratio = maxVal / minVal;
      clampMatches.push({ min, max, ratio });
      
      // Check for aggressive type scaling
      if (ratio > 4) {
        issues.push({
          persona: 'typography',
          issue: `Typography scale has ${ratio.toFixed(1)}x jump (${min} → ${max}). Middle breakpoints may break rhythm.`,
          severity: ratio > 5 ? 'critical' : 'high',
          file: 'tailwind.config.ts',
        });
      }
    }
  }
  
  // Check for line-height issues
  const lineHeightRegex = /["']?(\d+\.?\d*)\s*\/\s*(\d+\.?\d*)["']?|lineHeight:\s*["']?([\d.]+)/g;
  const lineHeights: number[] = [];
  
  while ((match = lineHeightRegex.exec(tailwindConfig)) !== null) {
    const lh = parseFloat(match[3] || match[2] || '1');
    if (!isNaN(lh) && lh > 0 && lh < 3) {
      lineHeights.push(lh);
    }
  }
  
  // Check for extremely tight line-heights (allow for display-* sizes as they are single-line)
  // Only flag line-heights below 0.85 which are dangerously tight
  const tightLineHeights = lineHeights.filter(lh => lh < 0.85);
  if (tightLineHeights.length > 0) {
    issues.push({
      persona: 'typography',
      issue: `Line-height below 0.85 (${tightLineHeights.join(', ')}) causes descenders to clip even on single-line titles.`,
      severity: 'high',
      file: 'tailwind.config.ts',
    });
  }
  
  // Check for letter-spacing inversions
  // NOTE: In professional typography, LARGER text typically has TIGHTER tracking
  // (negative letter-spacing) because the larger size already provides visual separation.
  // SMALLER text needs LOOSER tracking to remain legible.
  // Valid progression: display-xl (-0.04em) → display-sm (-0.01em)
  const letterSpacings: { size: string; value: number }[] = [];
  
  // Simple heuristic: look for patterns like "display-xl": ... letterSpacing: "-0.03em"
  const sizeBlocks = tailwindConfig.split(/["']display-/);
  sizeBlocks.forEach((block, i) => {
    if (i === 0) return;
    const sizeMatch = block.match(/^([a-z]+)["']/);
    const lsMatch = block.match(/letterSpacing:\s*["']?(-?[\d.]+)em/);
    if (sizeMatch && lsMatch) {
      letterSpacings.push({ size: sizeMatch[1], value: parseFloat(lsMatch[1]) });
    }
  });
  
  // Check if larger sizes have LOOSER tracking than smaller (which would be inverted)
  // Correct: xl=-0.04, lg=-0.03, md=-0.02, sm=-0.01 (larger = tighter)
  // Inverted: xl=-0.01, lg=-0.02, md=-0.03, sm=-0.04 (larger = looser) 
  if (letterSpacings.length >= 2) {
    const sizeOrder = ['sm', 'md', 'lg', 'xl', '2xl', '3xl'];
    const sorted = [...letterSpacings].sort((a, b) => {
      return sizeOrder.indexOf(a.size) - sizeOrder.indexOf(b.size);
    });
    
    for (let i = 1; i < sorted.length; i++) {
      // If larger size (higher index) has LOOSER tracking (less negative), that's inverted
      // Example: md=-0.02, lg=-0.01 would be inverted (lg should be tighter, not looser)
      if (sorted[i].value > sorted[i-1].value) {
        issues.push({
          persona: 'typography',
          issue: `Letter-spacing inverted: display-${sorted[i].size} (${sorted[i].value}em) looser than display-${sorted[i-1].size} (${sorted[i-1].value}em). Larger type should have tighter tracking.`,
          severity: 'medium',
          file: 'tailwind.config.ts',
        });
        break;
      }
    }
  }
  
  // Check for mixing uppercase labels with sentence case body
  const hasUppercaseLabels = Object.values(files).some(content => 
    /uppercase.*tracking-widest|tracking-widest.*uppercase/i.test(content)
  );
  
  const hasSentenceCaseBody = Object.values(files).some(content =>
    /text-(?:sm|base|lg).*[^uppercase]/i.test(content)
  );
  
  if (hasUppercaseLabels && hasSentenceCaseBody) {
    issues.push({
      persona: 'typography',
      issue: 'Uppercase labels with tracking-widest mixed with sentence case body text. Vertical rhythm breaks at section boundaries.',
      severity: 'low',
    });
  }
  
  // Check for monospace font used for non-code content
  const monoInContent = Object.entries(files).filter(([path, content]) => 
    path.endsWith('.tsx') && 
    !path.includes('Code') && 
    /font-mono/.test(content) &&
    !/code|pre|terminal|console/i.test(content)
  );
  
  if (monoInContent.length > 0) {
    issues.push({
      persona: 'typography',
      issue: `Monospace font used for non-code content in: ${monoInContent.map(([p]) => p.split('/').pop()).join(', ')}. Creates dual hierarchy: display for meaning, mono for metadata.`,
      severity: 'medium',
    });
  }
  
  return issues;
};
