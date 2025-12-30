import { useState, useCallback } from 'react';
import { useReveal } from '@/contexts/RevealContext';

/**
 * Manages the preloader lifecycle and reveal trigger coordination.
 * 
 * This hook encapsulates the loading state management and ensures
 * the reveal animation is triggered at the correct time after
 * the preloader completes.
 * 
 * @returns {Object} Preloader state and handlers
 * @returns {boolean} isLoading - Whether the preloader is still active
 * @returns {Function} handlePreloaderComplete - Callback for preloader completion
 * 
 * @example
 * const { isLoading, handlePreloaderComplete } = usePreloaderState();
 * 
 * return (
 *   <>
 *     {isLoading && <Preloader onComplete={handlePreloaderComplete} />}
 *     <MainContent />
 *   </>
 * );
 */
export const usePreloaderState = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { triggerReveal } = useReveal();

  /**
   * Handles preloader completion by updating loading state
   * and triggering the section reveal cascade after a brief delay.
   * 
   * The 100ms delay ensures the DOM has settled before
   * triggering Framer Motion animations.
   */
  const handlePreloaderComplete = useCallback(() => {
    setIsLoading(false);
    setTimeout(() => {
      triggerReveal();
    }, 100);
  }, [triggerReveal]);

  return {
    isLoading,
    handlePreloaderComplete,
  };
};
