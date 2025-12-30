# Awwwards Jury Simulation

A **dynamic** code audit tool that scans your actual codebase and simulates the Awwwards jury review process through 7 expert personas, evaluating your creative web project with clinical precision.

## How It Works

Unlike static linters, this tool **reads your actual source files** and analyzes them for:
- Animation library conflicts (GSAP vs Framer Motion on sibling elements)
- Accessibility violations (missing alt text, skip links, focus states)
- Typography inconsistencies (clamp ratios, line-height mismatches)
- Performance anti-patterns (layout-triggering properties, excessive animations)
- Art direction cohesion (mixed aesthetic signals, color system violations)

## The Panel of Experts

### 1. 🎨 Art Direction (The Aesthetician)
**Analyzes:** `index.css`, `tailwind.config.ts`, component files
- Detects mixed aesthetic signals (brutalist vs soft effects)
- Validates CSS variable usage and color system consistency
- Flags box-shadow/blur conflicts with sharp geometric elements

### 2. 📐 Typography (The Typesetter)
**Analyzes:** `tailwind.config.ts`, CSS files
- Validates clamp() ratio consistency (flags >4x jumps)
- Checks line-height values across type scales
- Detects letter-spacing inversions

### 3. 📏 Grid & Composition (The Architect)
**Analyzes:** Component files, layout components
- Detects hardcoded max-width values vs design tokens
- Validates spacing rhythm consistency
- Flags padding/margin inconsistencies

### 4. 🎬 Motion (The Choreographer)
**Analyzes:** All component files, animation hooks
- Detects GSAP + Framer Motion conflicts
- Validates scrub value consistency across ScrollTrigger instances
- Checks for `prefers-reduced-motion` respect
- Flags infinite animations without user control

### 5. 🧭 UX/Navigation (The Guide)
**Analyzes:** `App.tsx`, NavigationBar, Preloader
- Validates skip-to-content link presence
- Checks navigation visibility patterns
- Flags excessive preloader durations (>2000ms)

### 6. ♿ Accessibility (The Auditor)
**Analyzes:** All component files
- Detects missing alt attributes on images
- Validates focus-visible styles exist
- Checks `prefers-reduced-motion` media query presence
- Flags cursor:none without accessibility fallbacks

### 7. ⚡ Dev/Performance (The Engineer)
**Analyzes:** `package.json`, component files
- Counts animation library dependencies
- Detects useState inside RAF/useFrame patterns
- Validates font loading strategy (display: swap)
- Flags layout-triggering properties in animations

## Usage

### Run the Audit

```bash
npm run audit
```

This will:
1. **Scan** all TypeScript, CSS, and config files in your project
2. **Analyze** through all 7 expert personas dynamically
3. **Generate** scores for 4 pillars (Design, Usability, Creativity, Content)
4. **Output** a color-coded terminal report with file counts
5. **Save** a detailed markdown report to `AUDIT_REPORT.md`
6. **Exit** with code 1 if score < 8.0, code 0 if score ≥ 8.0

### Example Output

```
╔════════════════════════════════════════════════════════════════╗
║             AWWWARDS JURY SIMULATION                           ║
║             Aiming for Site of the Year                        ║
╚════════════════════════════════════════════════════════════════╝

Scanning codebase...

✓ Analyzed 47 files
Generated at: 2024-01-15T10:30:00.000Z

Overall Score: 7.2/10

The Scores
Design:      7.5/10  (0 critical, 2 high severity issues)
Usability:   6.8/10  (1 critical, 3 high severity issues)
Creativity:  8.1/10  (0 critical, 1 high severity issues)
Content:     7.0/10  (0 critical, 2 high severity issues)

Files Analyzed: 47
```

### Integration with CI/CD

```yaml
- name: Run Awwwards Audit
  run: npm run audit
```

The audit will fail the build if the overall score is below 8.0.

## Output Format

### 1. The Score
Predicted score (1-10) for each of the 4 pillars based on **actual findings** in your code:
- **Design**: Art direction, typography, composition
- **Usability**: Navigation and accessibility
- **Creativity**: Motion design and art direction
- **Content**: Typography, grid, and technical implementation

### 2. The Findings
Each finding includes:
- **File path** where the issue was detected
- **Severity level**: 🔴 CRITICAL, 🟠 HIGH, 🟡 MEDIUM, ⚪ LOW
- **Specific issue** with actionable description
- **Conflict detection** when experts disagree

### 3. The Synthesis (The Creative Director)
Final paragraph resolving conflicts and providing the **single most impactful action** to improve the score.

## Architecture

```
src/lib/audit/
├── types.ts              # Shared TypeScript interfaces
├── file-reader.ts        # File system utilities (Node.js)
├── pattern-matchers.ts   # Regex pattern library
├── index.ts              # Barrel exports
└── analyzers/
    ├── art-direction.ts  # Aesthetic cohesion analysis
    ├── typography.ts     # Type scale validation
    ├── grid-composition.ts # Layout rhythm checks
    ├── motion.ts         # Animation conflict detection
    ├── ux-navigation.ts  # Navigation pattern analysis
    ├── accessibility.ts  # WCAG compliance checks
    ├── dev-performance.ts # Performance anti-patterns
    └── index.ts          # Analyzer exports

src/lib/awwwards-audit.ts # Main orchestrator
scripts/run-audit.ts      # CLI runner
```

## Extending the Audit

### Add a New Pattern

Edit `src/lib/audit/pattern-matchers.ts`:

```typescript
export const MY_PATTERNS = {
  CUSTOM_ISSUE: /my-regex-pattern/g,
};
```

### Add a New Analyzer Check

Edit the relevant analyzer in `src/lib/audit/analyzers/`:

```typescript
// In motion.ts
if (ANIMATION_PATTERNS.MY_PATTERN.test(content)) {
  issues.push({
    persona: 'motion',
    issue: `${filePath}: Description of the issue found`,
    severity: 'high',
    conflictsWith: ['accessibility'], // Optional
  });
}
```

## Philosophy

This tool embodies the Awwwards standard: technical excellence, creative boldness, and user-centric design are not negotiable. The audit dynamically reflects your **current code state** — fix issues and the score improves.

Every friction point is an opportunity. Every conflict is a design decision waiting to be made. Fix the conflicts first, then iterate.

---

**Remember:** Anything less than 10/10 is failure. Make it count.
