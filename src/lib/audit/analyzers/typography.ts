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
  
  // Check for extremely tight line-heights
  const tightLineHeights = lineHeights.filter(lh => lh < 1);
  if (tightLineHeights.length > 0) {
    issues.push({
      persona: 'typography',
      issue: `Line-height below 1.0 (${tightLineHeights.join(', ')}) causes descenders to clip on multi-line text. Acceptable only for guaranteed single-line titles.`,
      severity: 'high',
      file: 'tailwind.config.ts',
    });
  }
  
  // Check for letter-spacing inversions
  const letterSpacingRegex = /letterSpacing:\s*["']?(-?[\d.]+)em["']?/g;
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
  
  // Check if smaller sizes have tighter tracking than larger (inverted)
  if (letterSpacings.length >= 2) {
    const sorted = [...letterSpacings].sort((a, b) => {
      const order = ['sm', 'md', 'lg', 'xl', '2xl', '3xl'];
      return order.indexOf(a.size) - order.indexOf(b.size);
    });
    
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].value < sorted[i-1].value) {
        issues.push({
          persona: 'typography',
          issue: `Letter-spacing inverted: display-${sorted[i].size} (${sorted[i].value}em) tighter than display-${sorted[i-1].size} (${sorted[i-1].value}em). Larger type should breathe more.`,
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
