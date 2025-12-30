/**
 * useScrollTriggerInit Hook
 * 
 * Initializes ScrollTrigger and ensures accurate layout calculations on mount.
 * This is a lightweight initialization hook - actual ScrollTrigger instances
 * should be created within component-scoped gsap.context() calls.
 * 
 * ## What This Does
 * - Calls ScrollTrigger.refresh() on mount after initial layout
 * - Provides a clean separation between "init" and "per-component" concerns
 * 
 * ## What This Does NOT Do
 * - Does not create a shared context (components should create their own)
 * - Does not manage individual ScrollTrigger instances
 * - Does not handle ongoing layout changes (see useScrollTriggerRefresh for that)
 * 
 * ## Related Hooks
 * - `useScrollTriggerRefresh`: Handles ongoing layout coordination (resize, fonts, content)
 * - `useLenis`: Sets up scrollerProxy for Lenis ↔ ScrollTrigger sync
 * 
 * @example
 * // In main layout/page component
 * useScrollTriggerInit();
 * useScrollTriggerRefresh(); // Pair with this for full coordination
 * 
 * // In individual section components, create scoped contexts:
 * useEffect(() => {
 *   const ctx = gsap.context(() => {
 *     gsap.to('.element', { x: 100, scrollTrigger: { trigger: '.element' } });
 *   }, containerRef);
 *   return () => ctx.revert();
 * }, []);
 * 
 * @module hooks/useScrollTriggerInit
 */

import { useEffect } from 'react';
import { ScrollTrigger } from '@/lib/gsap';

export const useScrollTriggerInit = (): void => {
  useEffect(() => {
    // Refresh after initial mount to ensure accurate calculations
    // This accounts for fonts loading, images sizing, etc.
    ScrollTrigger.refresh();
  }, []);
};
