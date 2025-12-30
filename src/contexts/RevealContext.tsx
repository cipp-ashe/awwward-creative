/**
 * RevealContext
 * 
 * Coordinates the initial page reveal cascade after the preloader completes.
 * Provides a global trigger that SectionReveal components listen to for
 * orchestrated entrance animations.
 * 
 * ## Flow
 * 1. Preloader completes → calls triggerReveal() via usePreloaderState
 * 2. Context sets isRevealed = true
 * 3. All SectionReveal components animate in with staggered delays
 * 
 * ## Scope
 * This context only manages the initial page load reveal.
 * Scroll-triggered reveals use ScrollReveal with Framer Motion's viewport detection.
 * 
 * @example
 * // Wrap page content
 * <RevealProvider>
 *   <IndexContent />
 * </RevealProvider>
 * 
 * // In components
 * const { isRevealed } = useReveal();
 * 
 * @module contexts/RevealContext
 */
import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface RevealContextType {
  isRevealed: boolean;
  triggerReveal: () => void;
}

const RevealContext = createContext<RevealContextType | undefined>(undefined);

export const RevealProvider = ({ children }: { children: ReactNode }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const triggerReveal = useCallback(() => {
    setIsRevealed(true);
  }, []);

  return (
    <RevealContext.Provider value={{ isRevealed, triggerReveal }}>
      {children}
    </RevealContext.Provider>
  );
};

export const useReveal = (): RevealContextType => {
  const context = useContext(RevealContext);
  if (!context) {
    throw new Error('useReveal must be used within a RevealProvider');
  }
  return context;
};
