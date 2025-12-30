/**
 * useGsapScrollTrigger Hook
 * 
 * Initializes GSAP ScrollTrigger with scoped cleanup using gsap.context().
 * This prevents the destructive global teardown that kills triggers owned by other components.
 * 
 * ## Architecture
 * - Uses gsap.context() to scope all ScrollTrigger instances created within the component tree
 * - Returns the context ref so child components can add animations to the same scope
 * - On unmount, only reverts animations created within this specific context
 * 
 * @example
 * const { gsap, ScrollTrigger, context } = useGsapScrollTrigger();
 * 
 * useEffect(() => {
 *   // Animations created here will be cleaned up when this component unmounts
 *   context.current?.add(() => {
 *     gsap.to('.element', { x: 100, scrollTrigger: { trigger: '.element' } });
 *   });
 * }, []);
 */

import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger } from '@/lib/gsap';

export const useGsapScrollTrigger = () => {
  const contextRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    // Create scoped context - all animations/triggers added to this context
    // will be automatically reverted on cleanup
    contextRef.current = gsap.context(() => {
      // Initial context scope - child components can add to this via context.current.add()
    });

    // Refresh after initial mount to ensure accurate calculations
    ScrollTrigger.refresh();

    return () => {
      // Scoped revert: only kills triggers/animations created within this context
      // Does NOT affect triggers owned by other components or routes
      contextRef.current?.revert();
      contextRef.current = null;
    };
  }, []);

  return { gsap, ScrollTrigger, context: contextRef };
};
