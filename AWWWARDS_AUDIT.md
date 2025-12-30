# Awwwards Jury Simulation

An automated code audit tool that simulates the Awwwards jury review process through 7 expert personas, evaluating your creative web project through clinical, unforgiving eyes.

## Purpose

This tool aims for "Site of the Year" standards — anything less than 10/10 is considered failure. It provides brutal, no-fluff feedback focused solely on friction points, not praise.

## The Panel of Experts

### 1. 🎨 Art Direction (The Aesthetician)
**Focus:** Cohesion. Is this brutalist, minimalist, or corporate? If mixed, it's flagged as failure.

### 2. 📐 Typography (The Typesetter)
**Focus:** Hierarchy, leading, kerning, and rhythmic vertical rhythm. Font choice is ignored; only the typography's breathing space matters.

### 3. 📏 Grid & Composition (The Architect)
**Focus:** Negative space. Is the grid honored or intentionally broken? Unintentional breaks are errors.

### 4. 🎬 Motion (The Choreographer)
**Focus:** Easing curves. Are animations masking poor UX? Do parent/child animations conflict?

### 5. 🧭 UX/Navigation (The Guide)
**Focus:** Is the "happy path" intuitive? Flags "mystery meat" navigation or dead ends.

### 6. ♿ Accessibility (The Auditor)
**Focus:** Strict WCAG compliance. Flags low contrast or keyboard traps. No "artistic license" allowed.

### 7. ⚡ Dev/Performance (The Engineer)
**Focus:** DOM complexity, heavy assets, and bundle size implications.

## Usage

### Run the Audit

```bash
npm run audit
```

This will:
1. Analyze the codebase through all 7 expert personas
2. Generate scores for 4 pillars (Design, Usability, Creativity, Content)
3. Output a color-coded terminal report
4. Save a detailed markdown report to `AUDIT_REPORT.md`
5. Exit with code 1 if score < 8.0, code 0 if score ≥ 8.0

### Integration with CI/CD

Add to your CI pipeline to enforce quality standards:

```yaml
- name: Run Awwwards Audit
  run: npm run audit
```

The audit will fail the build if the overall score is below 8.0.

## Output Format

### 1. The Score
Predicted score (1-10) for each of the 4 pillars:
- **Design**: Art direction, typography, composition
- **Usability**: Navigation and accessibility
- **Creativity**: Motion design and art direction
- **Content**: Typography, grid, and technical implementation

### 2. The Brutal Feedback
Bullet points from each Expert Persona highlighting **only** friction points:
- 🔴 **CRITICAL**: Major issues that break the experience
- 🟠 **HIGH**: Significant problems requiring attention
- 🟡 **MEDIUM**: Notable issues that should be addressed
- ⚪ **LOW**: Minor inconsistencies

### 3. The Synthesis (The Creative Director)
Final paragraph resolving conflicts between experts and providing the **single most impactful action** to improve the score.

## Rules of Engagement

### No Fluff
No phrases like "Great job" or "In the realm of." Clinical analysis only.

### Prioritize Conflict
When Motion expert wants an animation that the Accessibility expert hates, the conflict is highlighted explicitly.

### Specifics Only
Not "improve performance." Instead: "The hero image LCP is likely too high; suggest WebP conversion and lazy loading."

## Example Output

```
Overall Score: 1/10

The Scores
Design:      1/10  (2 critical, 5 high severity issues)
Usability:   1/10  (3 critical, 6 high severity issues)
Creativity:  1/10  (1 critical, 4 high severity issues)
Content:     1/10  (4 critical, 7 high severity issues)

Expert Conflicts Detected:
- motion vs accessibility: CustomCursor hides native cursor...

Most Impactful Action:
Unify animation orchestration. Hero section mixes Framer Motion 
and GSAP on sibling elements. Choose one system...
```

## Files

- `src/lib/awwwards-audit.ts` - Core audit logic and expert analyzers
- `scripts/run-audit.ts` - CLI runner with colored output
- `AUDIT_REPORT.md` - Generated report (gitignored)

## Customization

To modify the audit criteria, edit the analyzer functions in `src/lib/awwwards-audit.ts`:

```typescript
const analyzeArtDirection = (): FrictionPoint[] => {
  // Add your own friction points
  issues.push({
    persona: 'art-direction',
    issue: 'Your custom issue description',
    severity: 'critical',
    conflictsWith: ['typography'],
  });
  return issues;
};
```

## Philosophy

This tool embodies the Awwwards standard: technical excellence, creative boldness, and user-centric design are not negotiable. The audit is deliberately harsh because "good enough" never wins Site of the Year.

Every friction point is an opportunity. Every conflict is a design decision waiting to be made. Fix the conflicts first, then iterate.

---

**Remember:** Anything less than 10/10 is failure. Make it count.
