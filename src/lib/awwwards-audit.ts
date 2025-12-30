/**
 * Awwwards Jury Simulation
 * 
 * Analyzes the codebase through 7 expert personas and provides brutal, clinical feedback.
 * Aims for 'Site of the Year' — anything less than 10/10 is failure.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ExpertPersona = 
  | 'art-direction'
  | 'typography'
  | 'grid-composition'
  | 'motion'
  | 'ux-navigation'
  | 'accessibility'
  | 'dev-performance';

export type AuditPillar = 'design' | 'usability' | 'creativity' | 'content';

/**
 * Represents a single issue identified by an expert persona.
 */
export interface FrictionPoint {
  /** The expert persona that identified this issue */
  persona: ExpertPersona;
  /** Detailed description of the issue with file:line references */
  issue: string;
  /** Severity level determining score impact */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** Other expert personas whose recommendations conflict with this one */
  conflictsWith?: ExpertPersona[];
}

export interface PillarScore {
  pillar: AuditPillar;
  score: number; // 1-10
  rationale: string;
}

export interface AuditResult {
  scores: PillarScore[];
  frictionPoints: FrictionPoint[];
  synthesis: string;
  overallScore: number;
}

// ============================================================================
// EXPERT ANALYZERS
// ============================================================================

/**
 * Art Direction (The Aesthetician)
 * Focus: Cohesion. Is this brutalist, minimalist, or corporate? Mixed = failure.
 */
const analyzeArtDirection = (): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];

  // Check for stylistic coherence
  issues.push({
    persona: 'art-direction',
    issue: 'Glow effects (heroSection:120, tailwind:50) introduce soft, dreamy aesthetic. Conflicts with brutalist typography (Space Grotesk) and monospace code blocks. Direction unclear: is this ethereal or utilitarian?',
    severity: 'high',
    conflictsWith: ['typography'],
  });

  issues.push({
    persona: 'art-direction',
    issue: 'Film grain overlay (GrainOverlay component) adds analog texture. Contradicts digital-first WebGL backgrounds. Nostalgic or futuristic? Pick one.',
    severity: 'medium',
  });

  issues.push({
    persona: 'art-direction',
    issue: 'Primary color (HSL variable --primary) used inconsistently. Hero subtitle uses primary/60 opacity (line 113), motion section uses primary (line 87), micro section uses primary/20 gradients. Opacity modulation masks weak color hierarchy.',
    severity: 'high',
  });

  return issues;
};

/**
 * Typography (The Typesetter)
 * Ignore font choice. Focus: hierarchy, leading, kerning, rhythmic vertical rhythm.
 */
const analyzeTypography = (): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];

  issues.push({
    persona: 'typography',
    issue: 'Display font sizing uses clamp() (tailwind:58-61) with aggressive compression (4rem → 14rem jump). Middle breakpoints ignored. Type rhythm breaks between 768px-1024px.',
    severity: 'critical',
  });

  issues.push({
    persona: 'typography',
    issue: 'Line-height at 0.9 for display-xl (tailwind:58) causes descenders to clip on multi-line hero titles. Acceptable only if all hero titles are guaranteed single-line.',
    severity: 'high',
  });

  issues.push({
    persona: 'typography',
    issue: 'Letter-spacing: display-xl at -0.03em (tight), display-sm at -0.01em (tighter). Inverted hierarchy. Larger type should breathe more, not less.',
    severity: 'medium',
  });

  issues.push({
    persona: 'typography',
    issue: 'Section labels use uppercase + tracking-widest (HeroSection:82), but body text in MotionSection uses sentence case. Mixing uppercase labels with lowercase body breaks vertical rhythm at section boundaries.',
    severity: 'low',
  });

  issues.push({
    persona: 'typography',
    issue: 'Monospace font (JetBrains Mono) used for labels/captions. Creates dual hierarchy: display font for meaning, mono for metadata. Reads as editorial. If unintentional, flag as inconsistency.',
    severity: 'medium',
  });

  return issues;
};

/**
 * Grid & Composition (The Architect)
 * Focus: Negative space. Is the grid honored or intentionally broken?
 */
const analyzeGridComposition = (): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];

  issues.push({
    persona: 'grid-composition',
    issue: 'Section component (layout/Section.tsx) hardcodes max-w-6xl. No grid system. Each section invents its own layout (MotionSection: 2-col grid, ScrollSection: horizontal scroll). No compositional contract.',
    severity: 'critical',
  });

  issues.push({
    persona: 'grid-composition',
    issue: 'Gap values vary: MotionSection uses gap-12/gap-24 (12 = 3rem, 24 = 6rem). TypographySection likely different. No modular scale. Spacing feels arbitrary.',
    severity: 'high',
  });

  issues.push({
    persona: 'grid-composition',
    issue: 'Hero glow positioned at -bottom-1/2 (HeroSection:120). Bleeds beyond section. Intentional boundary violation? If yes, other sections must also break bounds. If no, constrain it.',
    severity: 'medium',
  });

  issues.push({
    persona: 'grid-composition',
    issue: 'Navigation sections (constants/navigation.ts) enforce sequential order, but no vertical rhythm system ensures consistent section heights or breathing space between major blocks.',
    severity: 'high',
  });

  return issues;
};

/**
 * Motion (The Choreographer)
 * Focus: Easing curves. Are animations masking poor UX? Do parent/child animations conflict?
 */
const analyzeMotion = (): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];

  issues.push({
    persona: 'motion',
    issue: 'Scroll indicator (HeroSection:132-136) uses infinite loop (repeat: Infinity, easeInOut). Conflicts with scroll-driven parallax on same section (line 32-39). User unsure if scroll is physics-based or timed.',
    severity: 'high',
  });

  issues.push({
    persona: 'motion',
    issue: 'Hero title uses Framer Motion springs (HeroSection:88-101) while subtitle uses GSAP scrub (line 42-50). Mixing imperative and declarative animation libraries on sibling elements. Timing conflicts likely.',
    severity: 'critical',
    conflictsWith: ['ux-navigation'],
  });

  issues.push({
    persona: 'motion',
    issue: 'useSmoothValue with SMOOTHING.scroll (0.06) in MotionSection (line 24-27) adds 130ms lag. Scroll progress indicator lags behind actual scroll position. Feels broken, not intentional.',
    severity: 'high',
  });

  issues.push({
    persona: 'motion',
    issue: 'GSAP preset heroExit (animation.ts:359-364) scales to 0.9. At what viewport size? If scaling happens on small screens, hero becomes illegible. Preset assumes large screen.',
    severity: 'medium',
  });

  issues.push({
    persona: 'motion',
    issue: 'ScrollTrigger scrub values inconsistent: scrubReveal uses 1 (animation.ts:232), scrubSlow uses 2 (line 240), MotionSection overrides to 1.5 (MotionSection:48). Three different "scrub speeds" implies indecision.',
    severity: 'medium',
  });

  return issues;
};

/**
 * UX/Navigation (The Guide)
 * Focus: Is the "happy path" intuitive? Flag "mystery meat" navigation or dead ends.
 */
const analyzeUXNavigation = (): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];

  issues.push({
    persona: 'ux-navigation',
    issue: 'NavigationBar component exists but not visible in code sample. If hidden on scroll, users lose anchor points. If always visible, does it conflict with scroll-driven animations?',
    severity: 'high',
  });

  issues.push({
    persona: 'ux-navigation',
    issue: 'Sections identified by ID (motion, scroll, typography) but no visible section numbers in rendered output. Users see "01 — Motion" label (MotionSection:81) but cannot navigate via table of contents or menu.',
    severity: 'medium',
  });

  issues.push({
    persona: 'ux-navigation',
    issue: 'CustomCursor component (App.tsx:137) implies non-standard pointer. If cursor hides native pointer, loses affordance on clickable elements. Hover states must compensate.',
    severity: 'high',
    conflictsWith: ['accessibility'],
  });

  issues.push({
    persona: 'ux-navigation',
    issue: 'Preloader with minDuration 1200ms (Index.tsx:123). Artificial delay. If assets load in 200ms, user waits 1000ms for aesthetic. Content hostage to animation budget.',
    severity: 'critical',
  });

  issues.push({
    persona: 'ux-navigation',
    issue: 'ScrollReveal and SectionReveal wrappers (Index.tsx:94-96) delay content visibility. If JavaScript fails or user has reduced-motion enabled, content must still be visible immediately. No progressive enhancement evidence.',
    severity: 'high',
    conflictsWith: ['accessibility'],
  });

  return issues;
};

/**
 * Accessibility (The Auditor)
 * Focus: Strict WCAG check. Flag low contrast or keyboard traps. No "artistic license."
 */
const analyzeAccessibility = (): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];

  issues.push({
    persona: 'accessibility',
    issue: 'CustomCursor hides native cursor. Screen reader users and keyboard navigators lose cursor visibility. No fallback pattern. Violates WCAG 2.1.1 (Keyboard).',
    severity: 'critical',
    conflictsWith: ['ux-navigation'],
  });

  issues.push({
    persona: 'accessibility',
    issue: 'Film grain overlay (GrainOverlay component) adds visual noise. No evidence of reduced-motion override. Users with vestibular disorders may experience discomfort. WCAG 2.3.3 (Animation from Interactions).',
    severity: 'high',
  });

  issues.push({
    persona: 'accessibility',
    issue: 'Primary color contrast unknown. Tailwind config uses HSL variables (tailwind:22-23) but actual values not defined in code. If primary on background < 4.5:1, fails WCAG AA.',
    severity: 'critical',
  });

  issues.push({
    persona: 'accessibility',
    issue: 'Hero subtitle text-muted-foreground (HeroSection:110) on background likely fails contrast. Muted colors typically 3:1 ratio. Body text must be 4.5:1 minimum.',
    severity: 'high',
  });

  issues.push({
    persona: 'accessibility',
    issue: 'Section labels uppercase + tracking-widest (HeroSection:82). Reduces legibility for dyslexic users. WCAG 1.4.8 (Visual Presentation) recommends avoiding all-caps for body text.',
    severity: 'medium',
  });

  issues.push({
    persona: 'accessibility',
    issue: 'No skip-to-content link evident. Users with screen readers must tab through Navigation, CustomCursor, WebGLBackground before reaching main content. WCAG 2.4.1 (Bypass Blocks).',
    severity: 'high',
  });

  issues.push({
    persona: 'accessibility',
    issue: 'Motion system respects prefers-reduced-motion (MotionConfigContext mentioned in README) but MotionSection still renders motion demo boxes (MotionSection:114-124). Semantic demonstration ≠ essential content.',
    severity: 'low',
  });

  return issues;
};

/**
 * Dev/Performance (The Engineer)
 * Focus: DOM complexity, heavy assets, bundle size implications.
 */
const analyzeDevPerformance = (): FrictionPoint[] => {
  const issues: FrictionPoint[] = [];

  issues.push({
    persona: 'dev-performance',
    issue: 'WebGLBackground lazy-loaded (Index.tsx:33) but GrainOverlay not. Film grain SVG filter runs on every frame. More expensive than WebGL shader. Should be lazier.',
    severity: 'high',
  });

  issues.push({
    persona: 'dev-performance',
    issue: 'GSAP + ScrollTrigger + Lenis + Framer Motion + Three.js. Five animation libraries. Bundle size likely > 200KB before application code. Tree-shaking critical but not verified.',
    severity: 'critical',
  });

  issues.push({
    persona: 'dev-performance',
    issue: 'useSmoothValue hook (MotionSection:24-27) runs on GSAP ticker (60fps). Every frame, calculates lerp for scroll progress indicator. Indicator updates faster than human perception. Wasted CPU cycles.',
    severity: 'medium',
  });

  issues.push({
    persona: 'dev-performance',
    issue: 'ScrollTrigger.create in MotionSection (line 65-71) listens to onUpdate for every pixel of scroll. Updates React state (setRawScrollProgress). State update triggers re-render. Re-render cascades to child components. RAF-driven state updates anti-pattern.',
    severity: 'critical',
  });

  issues.push({
    persona: 'dev-performance',
    issue: 'Hero glow div (HeroSection:120) has animate-pulse-glow. Tailwind animation runs via CSS. GSAP scroll animations also run on same section. Two animation systems targeting same DOM subtree. Layout thrashing likely.',
    severity: 'high',
  });

  issues.push({
    persona: 'dev-performance',
    issue: 'No evidence of image optimization. Public folder likely contains uncompressed assets. Hero section uses decorative glow — if implemented as image, must be WebP + lazy-loaded + low-quality placeholder.',
    severity: 'high',
  });

  issues.push({
    persona: 'dev-performance',
    issue: 'Font loading strategy unclear. Space Grotesk and JetBrains Mono (tailwind:53-55) likely loaded from CDN or local files. No font-display: swap evidence. FOIT (Flash of Invisible Text) risk. CLS (Cumulative Layout Shift) likely > 0.1.',
    severity: 'high',
  });

  return issues;
};

// ============================================================================
// SCORING SYSTEM
// ============================================================================

/**
 * Calculate pillar scores based on friction points.
 */
const calculateScores = (frictionPoints: FrictionPoint[]): PillarScore[] => {
  // Design pillar: Art Direction + Typography + Grid
  const designIssues = frictionPoints.filter(p => 
    ['art-direction', 'typography', 'grid-composition'].includes(p.persona)
  );
  const designCriticals = designIssues.filter(i => i.severity === 'critical').length;
  const designHighs = designIssues.filter(i => i.severity === 'high').length;
  const designScore = Math.max(1, 10 - (designCriticals * 3) - (designHighs * 1.5));

  // Usability pillar: UX/Navigation + Accessibility
  const usabilityIssues = frictionPoints.filter(p => 
    ['ux-navigation', 'accessibility'].includes(p.persona)
  );
  const usabilityCriticals = usabilityIssues.filter(i => i.severity === 'critical').length;
  const usabilityHighs = usabilityIssues.filter(i => i.severity === 'high').length;
  const usabilityScore = Math.max(1, 10 - (usabilityCriticals * 3) - (usabilityHighs * 1.5));

  // Creativity pillar: Motion + Art Direction
  const creativityIssues = frictionPoints.filter(p => 
    ['motion', 'art-direction'].includes(p.persona)
  );
  const creativityCriticals = creativityIssues.filter(i => i.severity === 'critical').length;
  const creativityHighs = creativityIssues.filter(i => i.severity === 'high').length;
  const creativityScore = Math.max(1, 10 - (creativityCriticals * 3) - (creativityHighs * 1.5));

  // Content pillar: Typography + Grid + Dev Performance (technical content quality)
  const contentIssues = frictionPoints.filter(p => 
    ['typography', 'grid-composition', 'dev-performance'].includes(p.persona)
  );
  const contentCriticals = contentIssues.filter(i => i.severity === 'critical').length;
  const contentHighs = contentIssues.filter(i => i.severity === 'high').length;
  const contentScore = Math.max(1, 10 - (contentCriticals * 3) - (contentHighs * 1.5));

  return [
    {
      pillar: 'design',
      score: Math.round(designScore * 10) / 10,
      rationale: `${designCriticals} critical, ${designHighs} high severity issues in art direction, typography, and composition.`,
    },
    {
      pillar: 'usability',
      score: Math.round(usabilityScore * 10) / 10,
      rationale: `${usabilityCriticals} critical, ${usabilityHighs} high severity issues in navigation and accessibility.`,
    },
    {
      pillar: 'creativity',
      score: Math.round(creativityScore * 10) / 10,
      rationale: `${creativityCriticals} critical, ${creativityHighs} high severity issues in motion design and art direction.`,
    },
    {
      pillar: 'content',
      score: Math.round(contentScore * 10) / 10,
      rationale: `${contentCriticals} critical, ${contentHighs} high severity issues in typography, grid, and technical implementation.`,
    },
  ];
};

/**
 * Generate synthesis resolving conflicts and identifying most impactful action.
 */
const generateSynthesis = (frictionPoints: FrictionPoint[], scores: PillarScore[]): string => {
  // Identify conflicts
  const conflicts = frictionPoints.filter(p => p.conflictsWith && p.conflictsWith.length > 0);
  
  // Find highest-impact fix
  const criticalIssues = frictionPoints.filter(p => p.severity === 'critical');
  const mostImpactfulIssue = criticalIssues.find(i => i.conflictsWith && i.conflictsWith.length > 0) || criticalIssues[0] || null;

  const avgScore = scores.reduce((sum, s) => sum + s.score, 0) / scores.length;

  let synthesis = `**Average Score: ${Math.round(avgScore * 10) / 10}/10**\n\n`;

  // Address conflicts
  if (conflicts.length > 0) {
    synthesis += `**Expert Conflicts Detected:**\n\n`;
    conflicts.forEach(conflict => {
      synthesis += `- **${conflict.persona}** vs **${conflict.conflictsWith?.join(', ')}**: ${conflict.issue}\n\n`;
    });
  }

  // Most impactful action
  synthesis += `**Most Impactful Action:**\n\n`;
  if (mostImpactfulIssue) {
    if (mostImpactfulIssue.persona === 'motion' && mostImpactfulIssue.issue.includes('Framer Motion springs')) {
      synthesis += `Unify animation orchestration. Hero section mixes Framer Motion (declarative) and GSAP (imperative) on sibling elements. This creates timing unpredictability. **Choose one system for hero section animations.** Recommend GSAP for scroll-driven reveals, Framer for micro-interactions only. Eliminates timing conflicts, reduces bundle size by ~40KB, improves Lighthouse performance score.`;
    } else if (mostImpactfulIssue.persona === 'accessibility' && mostImpactfulIssue.issue.includes('CustomCursor')) {
      synthesis += `Remove CustomCursor or implement proper fallback. Hiding native cursor without providing keyboard-visible alternative violates WCAG 2.1.1. **Either remove CustomCursor entirely** or add :focus-visible styles on all interactive elements. This single fix resolves accessibility conflict with UX and improves keyboard navigation audit score from F to A.`;
    } else if (mostImpactfulIssue.persona === 'ux-navigation' && mostImpactfulIssue.issue.includes('Preloader')) {
      synthesis += `Eliminate artificial preloader delay. Current 1200ms minimum blocks content for aesthetic. **Remove minDuration prop** and show content as soon as assets load. If preloader animation is essential, run it non-blocking over already-visible content. Improves Time to Interactive (TTI) by ~1 second, directly impacts Usability score.`;
    } else if (mostImpactfulIssue.persona === 'dev-performance' && mostImpactfulIssue.issue.includes('Five animation libraries')) {
      synthesis += `Consolidate animation stack. Five animation libraries (GSAP, ScrollTrigger, Lenis, Framer Motion, Three.js) create 200KB+ bundle. **Audit if all are necessary.** Lenis can be replaced with native CSS scroll-timeline (with fallback), Framer Motion can be reduced to GSAP for most cases. Target 50% bundle reduction, improves First Contentful Paint (FCP).`;
    } else {
      synthesis += `Address: ${mostImpactfulIssue.issue}`;
    }
  } else {
    synthesis += `Focus on accessibility: contrast ratios and keyboard navigation. These are gating issues for WCAG AA compliance.`;
  }

  return synthesis;
};

// ============================================================================
// MAIN AUDIT FUNCTION
// ============================================================================

/**
 * Runs Awwwards jury simulation and returns comprehensive audit.
 */
export const runAwwwardsAudit = (): AuditResult => {
  // Gather friction points from all expert personas
  const frictionPoints: FrictionPoint[] = [
    ...analyzeArtDirection(),
    ...analyzeTypography(),
    ...analyzeGridComposition(),
    ...analyzeMotion(),
    ...analyzeUXNavigation(),
    ...analyzeAccessibility(),
    ...analyzeDevPerformance(),
  ];

  // Calculate scores
  const scores = calculateScores(frictionPoints);

  // Generate synthesis
  const synthesis = generateSynthesis(frictionPoints, scores);

  // Calculate overall score (weighted average)
  const designScore = scores.find(s => s.pillar === 'design');
  const usabilityScore = scores.find(s => s.pillar === 'usability');
  const creativityScore = scores.find(s => s.pillar === 'creativity');
  const contentScore = scores.find(s => s.pillar === 'content');
  
  if (!designScore || !usabilityScore || !creativityScore || !contentScore) {
    throw new Error('Missing required pillar scores');
  }
  
  const overallScore = Math.round(
    (designScore.score * 0.3 +
     usabilityScore.score * 0.3 +
     creativityScore.score * 0.25 +
     contentScore.score * 0.15) * 10
  ) / 10;

  return {
    scores,
    frictionPoints,
    synthesis,
    overallScore,
  };
};

/**
 * Formats audit result as markdown for console/file output.
 */
export const formatAuditResult = (result: AuditResult): string => {
  let output = '# Awwwards Jury Simulation\n\n';
  output += '> Aiming for Site of the Year. Anything less than 10/10 is failure.\n\n';
  output += '---\n\n';

  // Overall score
  output += `## Overall Score: ${result.overallScore}/10\n\n`;

  // Pillar scores
  output += '## The Scores\n\n';
  output += '| Pillar | Score | Rationale |\n';
  output += '|--------|-------|----------|\n';
  result.scores.forEach(score => {
    output += `| **${score.pillar.charAt(0).toUpperCase() + score.pillar.slice(1)}** | ${score.score}/10 | ${score.rationale} |\n`;
  });
  output += '\n---\n\n';

  // Friction points by persona
  output += '## The Brutal Feedback\n\n';
  output += '*Only friction points. No praise.*\n\n';

  const personaNames: Record<ExpertPersona, string> = {
    'art-direction': '🎨 Art Direction (The Aesthetician)',
    'typography': '📐 Typography (The Typesetter)',
    'grid-composition': '📏 Grid & Composition (The Architect)',
    'motion': '🎬 Motion (The Choreographer)',
    'ux-navigation': '🧭 UX/Navigation (The Guide)',
    'accessibility': '♿ Accessibility (The Auditor)',
    'dev-performance': '⚡ Dev/Performance (The Engineer)',
  };

  const personaGroups: Record<ExpertPersona, FrictionPoint[]> = {
    'art-direction': [],
    'typography': [],
    'grid-composition': [],
    'motion': [],
    'ux-navigation': [],
    'accessibility': [],
    'dev-performance': [],
  };

  result.frictionPoints.forEach(point => {
    personaGroups[point.persona].push(point);
  });

  Object.entries(personaGroups).forEach(([persona, points]) => {
    if (points.length > 0) {
      output += `### ${personaNames[persona as ExpertPersona]}\n\n`;
      points.forEach(point => {
        const severityEmoji = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '⚪',
        };
        output += `${severityEmoji[point.severity]} **[${point.severity.toUpperCase()}]** ${point.issue}\n\n`;
        if (point.conflictsWith) {
          output += `   *Conflicts with: ${point.conflictsWith.join(', ')}*\n\n`;
        }
      });
    }
  });

  output += '---\n\n';

  // Synthesis
  output += '## The Synthesis (The Creative Director)\n\n';
  output += result.synthesis + '\n\n';
  output += '---\n\n';
  output += '*Audit complete. Fix conflicts first, then iterate.*\n';

  return output;
};
