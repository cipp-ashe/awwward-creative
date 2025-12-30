# Awwwards Jury Simulation - Quick Start Guide

## What is This?

A brutal, clinical code audit tool that simulates the Awwwards jury review process. It analyzes your codebase through 7 expert personas and scores your project against "Site of the Year" standards.

**Standard**: Anything less than 10/10 is failure.

## Quick Run

```bash
npm run audit
```

## What You'll Get

### 1. Overall Score
A single number (1-10) representing your project's quality.

### 2. Pillar Scores
Individual scores for:
- **Design** (Art Direction + Typography + Grid)
- **Usability** (Navigation + Accessibility)
- **Creativity** (Motion + Art Direction)
- **Content** (Typography + Grid + Performance)

### 3. Friction Points
Every issue identified, organized by expert:
- 🔴 **CRITICAL**: Must fix immediately
- 🟠 **HIGH**: Fix soon
- 🟡 **MEDIUM**: Should address
- ⚪ **LOW**: Nice to fix

### 4. Conflicts
When experts disagree (e.g., Motion wants animation that Accessibility hates), the conflict is highlighted.

### 5. Most Impactful Action
One single recommendation that will improve your score the most.

## Current Score Example

```
Overall Score: 1.0/10

┌────────────┬────────┬──────────────────────────────────────┐
│ Pillar     │ Score  │ Issues                               │
├────────────┼────────┼──────────────────────────────────────┤
│ Design     │ 1.0/10 │ 2 critical, 5 high                   │
│ Usability  │ 1.0/10 │ 3 critical, 6 high                   │
│ Creativity │ 1.0/10 │ 1 critical, 4 high                   │
│ Content    │ 1.0/10 │ 4 critical, 7 high                   │
└────────────┴────────┴──────────────────────────────────────┘
```

## The 7 Expert Personas

### 🎨 Art Direction
Focus: Is the aesthetic cohesive or confused?

### 📐 Typography  
Focus: Does the type breathe? (hierarchy, leading, kerning)

### 📏 Grid & Composition
Focus: Is negative space honored or broken without intent?

### 🎬 Motion
Focus: Do animations conflict? Are easing curves intentional?

### 🧭 UX/Navigation
Focus: Is the happy path intuitive or a mystery?

### ♿ Accessibility
Focus: Strict WCAG compliance. No "artistic license."

### ⚡ Dev/Performance
Focus: Bundle size, DOM complexity, asset optimization.

## Example Output

```
🔴 [CRITICAL] Hero title uses Framer Motion springs while 
subtitle uses GSAP scrub. Mixing imperative and declarative 
animation libraries on sibling elements. Timing conflicts likely.

   Conflicts with: ux-navigation

Most Impactful Action:
Unify animation orchestration. Choose one system for hero 
section animations. Recommend GSAP for scroll-driven reveals, 
Framer for micro-interactions only. Eliminates timing conflicts, 
reduces bundle size by ~40KB.
```

## CI Integration

The audit exits with:
- **Code 0**: Score ≥ 8.0 (pass)
- **Code 1**: Score < 8.0 (fail)

Add to your CI pipeline:
```yaml
- name: Quality Gate
  run: npm run audit
```

## Philosophy

### No Fluff
No "great job" or "well done." Clinical analysis only.

### Conflicts Are Insights
When Motion and Accessibility disagree, that's where design decisions happen.

### Specifics Only
Never: "improve performance"  
Always: "Hero image LCP likely too high; use WebP + lazy load"

## Files Generated

- **AUDIT_REPORT.md**: Full detailed report (gitignored)
- Terminal output: Color-coded summary

## Next Steps

1. Run audit: `npm run audit`
2. Read synthesis section
3. Fix the most impactful issue
4. Re-run audit
5. Iterate until score ≥ 8.0

## Documentation

- **AWWWARDS_AUDIT.md**: Complete documentation
- **IMPLEMENTATION_SUMMARY.md**: Technical details
- **README.md**: Project integration

---

**Remember**: Anything less than 10/10 is failure. Make it count.
