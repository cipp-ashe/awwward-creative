# Motion Showcase

An experimental demonstrator of modern creative web patterns — motion, scroll, typography, and performance working together.

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
│   ├── animation.ts         # Easing, durations, stagger, delays
│   ├── layout.ts            # Z-index, breakpoints, spacing
│   └── index.ts
│
├── contexts/
│   └── RevealContext.tsx    # Page reveal state management
│
├── hooks/
│   ├── useAssetLoader.ts    # Preloader asset tracking
│   ├── useCursor.ts         # Smooth cursor position
│   ├── useCursorVisibility.ts # Global cursor DOM state
│   ├── useLenis.ts          # Smooth scroll initialization
│   ├── useMobile.ts         # Viewport detection
│   ├── useScrollTriggerInit.ts # ScrollTrigger initialization
│   ├── useScrollTriggerRefresh.ts # Layout coordination
│   ├── useTicker.ts         # GSAP ticker wrapper
│   └── useToast.ts          # Toast notifications
│   └── useToast.ts          # Toast notifications
│
├── lib/
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
   - Integrates with GSAP ScrollTrigger

### How They Work Together

```
User Scrolls
     │
     ▼
┌─────────────┐
│   Lenis     │  Intercepts native scroll, applies easing
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ ScrollTrigger│  Maps scroll position to animation progress
└──────┬──────┘
       │
       ├──► GSAP Tweens (transforms, opacity, clip-path)
       │
       └──► React State Updates (for Framer Motion components)
                    │
                    ▼
            ┌─────────────┐
            │Framer Motion│  Handles component transitions
            └─────────────┘
```

## Runtime Model

### Animation Loop Ownership

The application uses two separate animation loops by design:

| System | Loop Owner | Responsibility |
|--------|------------|----------------|
| GSAP/Lenis | `gsap.ticker` | Scroll-linked DOM animations, cursor interpolation |
| WebGL (R3F) | React Three Fiber | 3D scene rendering, shader updates |

This separation is intentional:
- DOM animations and smooth scrolling share timing via GSAP's ticker
- WebGL has independent frame budget needs and its own optimized render loop
- Page Visibility API gates both systems when the tab is backgrounded

### Time Units

- **GSAP ticker deltaTime**: Milliseconds (converted to seconds in `useTicker`)
- **Consumer callbacks**: Receive seconds for consistency

```

### Using the Constants

```tsx
// Import centralized values
import { EASING_ARRAY, DURATION, STAGGER } from '@/constants/animation';
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

// Z-index
<div style={{ zIndex: Z_INDEX.modal }} />
```

### GSAP Best Practices

```tsx
// Always import from centralized lib (plugins pre-registered)
import { gsap, ScrollTrigger } from '@/lib/gsap';

// Use context for cleanup
useEffect(() => {
  const ctx = gsap.context(() => {
    // All animations here
    gsap.to('.element', { ... });
    
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 80%',
      // ...
    });
  }, containerRef); // Scope to container

  return () => ctx.revert(); // Clean up all animations
}, []);
```

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

## Performance Considerations

- **GPU-only transforms**: Only animate `transform` and `opacity`
- **Code splitting**: WebGL scenes load on-demand via `React.lazy`
- **Reduced motion**: All animations respect `prefers-reduced-motion`
- **Visibility-based rendering**: WebGL pauses when not in viewport
- **Lerp-based smoothing**: Uses `requestAnimationFrame` for cursor/scroll

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
- **Docs**: https://docs.lovable.dev
