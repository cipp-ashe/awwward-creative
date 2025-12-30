# Architecture Documentation

> Comprehensive runtime model and system boundaries for the Motion Showcase project.

## Table of Contents

1. [Runtime Model](#runtime-model)
2. [Animation System Boundaries](#animation-system-boundaries)
3. [Scroll Integration Flow](#scroll-integration-flow)
4. [Event-Driven Systems](#event-driven-systems)
5. [Accessibility Governance](#accessibility-governance)
6. [Hook Dependency Graph](#hook-dependency-graph)
7. [Performance Contracts](#performance-contracts)

---

## Runtime Model

The application maintains **two independent animation loops** by design. This is intentional architectural separation, not a bug.

### Loop Ownership Matrix

| System | Loop Owner | Frame Source | Consumers |
|--------|------------|--------------|-----------|
| DOM Animations | `gsap.ticker` | GSAP internal RAF | Lenis, useTicker, useCursor, useSmoothValue |
| WebGL Rendering | React Three Fiber | R3F internal RAF | WebGLBackground, WebGL3DSection |

### Why Two Loops?

1. **Frame Budget Isolation**: WebGL scenes have different performance characteristics than DOM animations. Separating them prevents GPU-heavy 3D rendering from causing scroll jank.

2. **Visibility Gating**: Each loop can be independently paused:
   - GSAP ticker consumers check `isReducedMotion`
   - R3F uses `frameloop="demand"` when inactive

3. **Cleanup Independence**: Route changes can tear down WebGL without affecting scroll animations, and vice versa.

### Time Units Contract

| Source | Unit | Conversion |
|--------|------|------------|
| GSAP ticker `deltaTime` | Milliseconds | `useTicker` converts to seconds: `deltaTime / 1000` |
| R3F `useFrame` state.clock | Seconds | Direct use |
| Lenis RAF callback | Milliseconds | Multiplied by 1000 for Lenis.raf() |

**Evidence**: 
- `src/hooks/useTicker.ts:96`: `const dt = Math.min(deltaTime / 1000, 0.1);`
- `src/hooks/useLenis.ts:85`: `lenis.raf(time * 1000);`

---

## Animation System Boundaries

### Layer 1: GSAP + ScrollTrigger (Scroll-Driven)

**Responsibility**: Scroll position → animation progress mapping

**Files**:
- `src/lib/gsap.ts` - Plugin registration (import from here, never from 'gsap' directly)
- `src/lib/animation-runtime.ts` - Global defaults, motion budget
- `src/hooks/useScrollTriggerInit.ts` - Mount-time refresh
- `src/hooks/useScrollTriggerRefresh.ts` - Layout coordination

**Lifecycle Pattern**:
```tsx
// Component-scoped cleanup (REQUIRED)
useEffect(() => {
  const ctx = gsap.context(() => {
    // All ScrollTriggers created here are auto-cleaned
    ScrollTrigger.create({ ... });
  }, containerRef);
  
  return () => ctx.revert(); // Only kills THIS component's triggers
}, []);
```

**Anti-Pattern**:
```tsx
// ❌ NEVER DO THIS - kills ALL ScrollTriggers globally
ScrollTrigger.killAll();
```

### Layer 2: Framer Motion (Component-Level)

**Responsibility**: Mount/unmount transitions, micro-interactions, spring physics

**Files**:
- Individual components use `motion` components directly
- `src/components/SectionReveal.tsx` - Cascade entrance orchestration
- `src/components/ScrollReveal.tsx` - Viewport-triggered reveals

**Integration with GSAP**:
Framer Motion and GSAP can coexist on the same elements, but:
- Don't animate the same CSS property with both simultaneously
- GSAP `pin: true` conflicts with Framer Motion layout animations (use `skipRevealWrapper` in section config)

### Layer 3: Lenis (Smooth Scroll Physics)

**Responsibility**: Intercepting native scroll, applying easing, providing virtual scroll position

**Files**:
- `src/hooks/useLenis.ts` - Initialization and GSAP integration

**Critical Integration Point** (`useLenis.ts:63-78`):
```tsx
ScrollTrigger.scrollerProxy(document.documentElement, {
  scrollTop(value) {
    if (arguments.length && value !== undefined) {
      lenis.scrollTo(value, { immediate: true });
    }
    return lenis.scroll; // Virtual position, not window.scrollY
  },
  // ...
});
```

**Why This Matters**: Without the scroller proxy, ScrollTrigger calculates pin positions based on native scroll, but the page is actually at Lenis's virtual position. This causes "pin drift" where pinned elements jump.

---

## Scroll Integration Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         User Scroll Input                           │
│                    (wheel, touch, keyboard)                         │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                              Lenis                                   │
│  • Intercepts native scroll events                                   │
│  • Applies easing (EASING_FN.easeOutExpo)                           │
│  • Maintains virtual scroll position                                 │
│  • Calls lenis.raf() on each GSAP ticker frame                      │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     ScrollTrigger.scrollerProxy                      │
│  • Maps virtual scroll → trigger calculations                        │
│  • Ensures pin start/end markers use Lenis position                 │
│  • Synced via: lenis.on('scroll', ScrollTrigger.update)             │
└─────────────────────────────────────────────────────────────────────┘
                                   │
                    ┌──────────────┴──────────────┐
                    ▼                              ▼
┌─────────────────────────────┐  ┌─────────────────────────────────────┐
│    ScrollTrigger Instances   │  │         useSmoothValue              │
│  • Pin/unpin elements        │  │  • Damped scroll progress           │
│  • Scrub animations          │  │  • Frame-rate independent           │
│  • Toggle classes            │  │  • Feeds: shaders, morphing, UI     │
└─────────────────────────────┘  └─────────────────────────────────────┘
```

### Refresh Coordination

**Problem**: ScrollTrigger calculates positions on init. If layout changes (fonts load, images resize), calculations become stale.

**Solution** (`useScrollTriggerRefresh.ts`):

| Trigger | Debounce | Reason |
|---------|----------|--------|
| `document.fonts.ready` | Immediate | Text reflow is critical, one-time |
| `window.resize` | 150ms | Frequent, needs batching |
| `ResizeObserver` on `<main>` | 100ms | Dynamic content changes |
| `orientationchange` | 200ms (delayed) | Layout needs time to settle |

---

## Event-Driven Systems

### Page Visibility API

**Consumers**:
- `src/components/WebGLBackground.tsx:116-121` - Pauses R3F loop
- `src/hooks/useTicker.ts` (indirectly via `isReducedMotion`)

**Pattern**:
```tsx
useEffect(() => {
  const handleVisibilityChange = () => {
    setIsActive(document.visibilityState === 'visible');
  };
  document.addEventListener('visibilitychange', handleVisibilityChange);
  return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

### Media Query Listeners

| Query | File | Effect |
|-------|------|--------|
| `(prefers-reduced-motion: reduce)` | `MotionConfigContext.tsx:95-110` | Global animation kill switch |
| `(min-width: 768px)` | `useCursorVisibility.ts:31` | Desktop cursor hiding |

### Mouse Events

| Event | File | Purpose |
|-------|------|---------|
| `mousemove` | `useCursor.ts:59` | Target position tracking |
| `mouseover/mouseout` | `useCursor.ts:60-61` | Interactive element detection |

### WebGL Context Events

| Event | File | Handler |
|-------|------|---------|
| `webglcontextlost` | `WebGLBackground.tsx:132-137` | Pause render, show fallback |
| `webglcontextrestored` | `WebGLBackground.tsx:139-143` | Resume if document visible |

---

## Accessibility Governance

### Reduced Motion as Kill Switch

When `prefers-reduced-motion: reduce` is active:

| System | Behavior | Implementation |
|--------|----------|----------------|
| Lenis | Disabled, native scroll | `useLenis.ts:43-46` returns null |
| useTicker | Callback skipped | `useTicker.ts:80-83` |
| useCursor | Direct position (no lerp) | `useCursor.ts:42-45` |
| useSmoothValue | Returns target directly | `useSmoothValue.ts:91-93` |
| WebGLBackground | Static fallback div | `WebGLBackground.tsx:160-168` |
| CustomCursor | Hidden via CSS `md:block` | CSS breakpoint |

### Context Ownership

```
App.tsx
  └── MotionConfigProvider (root level)
        └── useMotionConfigSafe() available everywhere
              └── isReducedMotion, shouldAnimate, motionScale
```

**Safe Hook** (`useMotionConfigSafe`): Returns defaults if called outside provider, useful for edge cases.

---

## Hook Dependency Graph

```
                    ┌──────────────────────┐
                    │  MotionConfigContext │
                    │   (isReducedMotion)  │
                    └──────────┬───────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│    useLenis     │  │    useTicker    │  │   useCursor     │
│  (smooth scroll)│  │  (GSAP ticker)  │  │  (mouse track)  │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                       gsap.ticker                            │
│              (Single RAF loop for DOM animations)            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    ScrollTrigger                             │
│        (Scroll position → animation progress)                │
└─────────────────────────────────────────────────────────────┘
```

### useSmoothValue Chain

```
Raw Value (scroll progress, mouse position)
         │
         ▼
┌─────────────────┐
│  useSmoothValue │ ◄── useTicker (frame updates)
│   or useSmoothVec2│
└────────┬────────┘
         │
         ▼
Damped Value → Shader uniforms, SVG morphing, UI elements
```

---

## Performance Contracts

### Motion Budget (`animation-runtime.ts:85-89`)

| Metric | Threshold | Warning At |
|--------|-----------|------------|
| Active ScrollTriggers | 20 max | 16 (80%) |
| Active GSAP Tweens | 50 max | 40 (80%) |

**Check in Dev Console**:
```js
window.__checkMotionBudget()
window.__getAnimationStatus()
window.__logScrollTriggers()
```

### Frame Budget Guidelines

| Operation | Target | Notes |
|-----------|--------|-------|
| GSAP ticker work | < 4ms | Leave headroom for browser |
| WebGL frame | < 8ms | Separate loop, can spike independently |
| React renders | Minimal | Bypass via refs for high-frequency updates |

### High-Frequency Update Pattern

For values that change every frame, bypass React state:

```tsx
// ❌ SLOW: Causes React render every frame
const [value, setValue] = useState(0);
useTicker(() => setValue(prev => prev + 1));

// ✅ FAST: Direct ref mutation
const valueRef = useRef(0);
useTicker(() => {
  valueRef.current += 1;
  // Direct DOM update if needed
  elementRef.current.textContent = valueRef.current;
});
```

**Evidence**: Performance section counters use GSAP proxy (`features/performance-counters` memory note).

---

## File Reference Matrix

| Concern | Primary File | Supporting Files |
|---------|--------------|------------------|
| GSAP Registration | `src/lib/gsap.ts` | - |
| Animation Defaults | `src/lib/animation-runtime.ts` | `src/constants/animation.ts` |
| Smooth Scroll | `src/hooks/useLenis.ts` | `useScrollTriggerRefresh.ts` |
| Scroll Init | `src/hooks/useScrollTriggerInit.ts` | - |
| Ticker Wrapper | `src/hooks/useTicker.ts` | - |
| Value Smoothing | `src/hooks/useSmoothValue.ts` | - |
| Cursor Logic | `src/hooks/useCursor.ts` | `useCursorVisibility.ts` |
| Motion Preferences | `src/contexts/MotionConfigContext.tsx` | - |
| WebGL Background | `src/components/WebGLBackground.tsx` | - |
| Section Config | `src/constants/navigation.ts` | - |

---

## Invariants (Must Always Be True)

1. **Import GSAP from `@/lib/gsap`** - Never from 'gsap' or 'gsap/ScrollTrigger' directly
2. **Scoped Cleanup** - Use `gsap.context().revert()`, never `ScrollTrigger.killAll()`
3. **Reduced Motion Respected** - All animation systems check `isReducedMotion`
4. **Lenis ↔ ScrollTrigger Sync** - Scroller proxy must be set and reset on cleanup
5. **lagSmoothing Restored** - `gsap.ticker.lagSmoothing(500, 33)` on Lenis cleanup
6. **Single Cursor Owner** - `useCursorVisibility()` called only in `App.tsx`
