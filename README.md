# Motion Showcase

An experimental demonstrator of modern creative web patterns — motion, scroll, typography, and performance working together.

> **Deep Dive**: See [ARCHITECTURE.md](./ARCHITECTURE.md) for comprehensive runtime model documentation, hook dependency graphs, and system boundaries.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         App Shell                               │
│                        (App.tsx)                                │
│    - useCursorVisibility() ownership                            │
│    - ThemeProvider, MotionConfigProvider                        │
├─────────────────────────────────────────────────────────────────┤
│                         Page Root                               │
│                      (pages/Index.tsx)                          │
│    - useLenis(), useScrollTriggerInit()                         │
│    - useScrollTriggerRefresh()                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Preloader  │  │  Navigation  │  │    WebGLBackground   │   │
│  │  (assets)    │  │    Bar       │  │    (Three.js)        │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Section Stack                          │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐ │   │
│  │  │  Hero   │ │ Motion  │ │ Scroll  │ │  Typography...  │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ CustomCursor │  │ GrainOverlay │  │    Lenis Scroll      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── components/
│   ├── layout/              # Reusable layout primitives
│   │   ├── Section.tsx      # Section, SectionLabel, SectionContent, SectionHeader
│   │   └── index.ts
│   │
│   ├── sections/            # Page sections (each self-contained)
│   │   ├── HeroSection.tsx
│   │   ├── MotionSection.tsx
│   │   ├── ScrollSection.tsx
│   │   ├── TypographySection.tsx
│   │   ├── MicroInteractionsSection.tsx
│   │   ├── PerformanceSection.tsx
│   │   ├── MorphingTextSection.tsx
│   │   ├── WebGL3DSection.tsx
│   │   └── FooterSection.tsx
│   │
│   ├── ui/                  # shadcn/ui components
│   │
│   ├── CustomCursor.tsx     # Mouse-following cursor
│   ├── GrainOverlay.tsx     # Film grain effect
│   ├── NavigationBar.tsx    # Scroll-aware navigation
│   ├── Preloader.tsx        # Asset loading screen
│   ├── ScrollReveal.tsx     # Framer Motion reveal animations
│   ├── SectionReveal.tsx    # Initial page load orchestration
│   └── WebGLBackground.tsx  # Three.js noise background
│
├── constants/
│   ├── animation.ts         # Easing, durations, stagger, delays, GSAP presets
│   ├── layout.ts            # Z-index, breakpoints, spacing
│   ├── navigation.ts        # Section configuration (single source of truth)
│   └── index.ts
│
├── contexts/
│   ├── MotionConfigContext.tsx  # Reduced motion preferences
│   └── RevealContext.tsx        # Page reveal state management
│
├── hooks/
│   ├── useAssetLoader.ts        # Preloader asset tracking
│   ├── useCursor.ts             # Smooth cursor position (uses useTicker)
│   ├── useCursorVisibility.ts   # Global cursor DOM state (App.tsx only)
│   ├── useLenis.ts              # Smooth scroll + ScrollTrigger proxy
│   ├── useMobile.ts             # Viewport detection
│   ├── usePreloaderState.ts     # Loading orchestration
│   ├── useScrollTriggerInit.ts  # ScrollTrigger mount refresh
│   ├── useScrollTriggerRefresh.ts # Layout change coordination
│   ├── useSmoothValue.ts        # Damped value interpolation
│   ├── useTicker.ts             # GSAP ticker wrapper for React
│   ├── useToast.ts              # Toast notifications
│   ├── useWebGLVisibility.ts    # Delayed WebGL mount
│   └── index.ts                 # Barrel exports
│
├── lib/
│   ├── animation-runtime.ts # Global GSAP config, motion budget
│   ├── gsap.ts              # Centralized GSAP plugin registration
│   ├── math.ts              # lerp, clamp, mapRange utilities
│   └── utils.ts             # cn() classname helper
│
├── pages/
│   ├── Index.tsx            # Main page composition
│   └── NotFound.tsx
│
└── types/
    ├── animation.ts         # Animation type definitions
    ├── section.ts           # Section props interfaces
    └── index.ts
```

## Animation System

### Three Animation Layers

1. **GSAP + ScrollTrigger** — Scroll-driven animations
   - Pinned sections, horizontal scroll, parallax
   - Scrub-based progress animations
   - Character-by-character text reveals

2. **Framer Motion** — Component-level animations
   - Enter/exit transitions
   - Hover/tap interactions
   - Spring physics
   - Viewport-triggered reveals

3. **Lenis** — Smooth scroll physics
   - Butter-smooth scroll interpolation
   - Touch and wheel normalization
   - Integrates with GSAP ScrollTrigger via `scrollerProxy`

### Scroll Integration Flow

```
User Scrolls
     │
     ▼
┌─────────────┐
│   Lenis     │  Intercepts native scroll, applies easing
└──────┬──────┘
       │
       ▼
┌─────────────────────┐
│ ScrollTrigger.      │  Maps virtual scroll position
│ scrollerProxy       │  to trigger calculations
└──────┬──────────────┘
       │
       ▼
┌─────────────┐
│ ScrollTrigger│  Maps scroll position to animation progress
└──────┬──────┘
       │
       ├──► GSAP Tweens (transforms, opacity, clip-path)
       │
       └──► useSmoothValue (damped values for shaders, morphing)
```

### Runtime Model

The application uses **two separate animation loops** by design:

| System | Loop Owner | Consumers |
|--------|------------|-----------|
| DOM Animations | `gsap.ticker` | Lenis, useTicker, useCursor, useSmoothValue |
| WebGL Rendering | React Three Fiber | WebGLBackground, WebGL3DSection |

**Time Units Contract**:
- GSAP ticker provides `deltaTime` in **milliseconds**
- `useTicker` converts to **seconds** for consumer callbacks
- All `useSmoothValue` and `useCursor` callbacks receive seconds

See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete runtime documentation.

### Using the Constants

```tsx
// Import centralized values
import { EASING_ARRAY, DURATION, STAGGER, SMOOTHING } from '@/constants/animation';
import { Z_INDEX } from '@/constants/layout';

// Framer Motion
<motion.div
  transition={{ 
    duration: DURATION.normal, 
    ease: EASING_ARRAY.smooth 
  }}
/>

// GSAP
gsap.to(element, {
  duration: DURATION.slow,
  ease: 'power2.out',
  stagger: STAGGER.normal,
});

// Damped scroll values
const smoothed = useSmoothValue(rawProgress, { smoothing: SMOOTHING.scroll });
```

### GSAP Best Practices

```tsx
// Always import from centralized lib (plugins pre-registered)
import { gsap, ScrollTrigger } from '@/lib/gsap';

// Use context for scoped cleanup (REQUIRED)
useEffect(() => {
  const ctx = gsap.context(() => {
    // All animations here are auto-cleaned on unmount
    gsap.to('.element', { ... });
    
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 80%',
      invalidateOnRefresh: true, // Recalculate on layout changes
    });
  }, containerRef);

  return () => ctx.revert(); // Only kills THIS component's triggers
}, []);
```

**Anti-Pattern**: Never use `ScrollTrigger.killAll()` — it destroys triggers from other components.

### Math Utilities

```tsx
import { lerp, clamp, mapRange } from '@/lib/math';

// Smooth interpolation
const smoothValue = lerp(current, target, 0.1);

// Constrain values
const bounded = clamp(value, 0, 100);

// Map scroll to opacity
const opacity = mapRange(scrollProgress, 0, 0.5, 0, 1);
```

## Section Layout System

### Using the Section Components

```tsx
import { Section, SectionLabel, SectionContent, SectionHeader } from '@/components/layout';

// Standard section with automatic wrapper
<Section id="motion" label="01 — Motion">
  <h2>Content here</h2>
</Section>

// Custom layout (no content wrapper)
<Section id="scroll" noContentWrapper>
  <div className="custom-horizontal-scroll">...</div>
</Section>

// Composable primitives
<section className="custom-section">
  <SectionLabel>01 — Motion</SectionLabel>
  <SectionContent>
    <SectionHeader 
      number="01" 
      label="Motion" 
      title={<>Animation is <span className="text-primary">interface</span></>}
    />
  </SectionContent>
</section>
```

### Adding New Sections

1. Add config to `src/constants/navigation.ts`
2. Create component in `src/components/sections/`
3. Add mapping in `src/pages/Index.tsx` `SECTION_COMPONENTS`

## Accessibility

All animation systems respect `prefers-reduced-motion`:

| System | Behavior when reduced motion |
|--------|------------------------------|
| Lenis | Disabled, native scroll |
| useTicker | Callback skipped |
| useCursor | Direct position (no lerp) |
| useSmoothValue | Returns target directly |
| WebGLBackground | Static gradient fallback |

## Performance Considerations

- **GPU-only transforms**: Only animate `transform` and `opacity`
- **Code splitting**: WebGL scenes load on-demand via `React.lazy`
- **Reduced motion**: All animations respect `prefers-reduced-motion`
- **Visibility gating**: WebGL pauses when document hidden (Page Visibility API)
- **Motion budget**: Dev-mode warnings when ScrollTrigger/tween counts exceed thresholds

### Dev Console Debugging

```js
window.__checkMotionBudget()   // Current trigger/tween counts
window.__getAnimationStatus()  // Full animation system status
window.__logScrollTriggers()   // List all active ScrollTriggers
```

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| Scroll Animation | GSAP + ScrollTrigger |
| Component Animation | Framer Motion |
| Smooth Scroll | Lenis |
| 3D/WebGL | Three.js + React Three Fiber |
| SVG Morphing | Flubber |

## Development

```sh
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Links

- **Lovable**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID
- **Architecture Docs**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Lovable Docs**: https://docs.lovable.dev
