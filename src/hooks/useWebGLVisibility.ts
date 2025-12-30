import { useEffect, useState } from 'react';

/**
 * Manages WebGL background visibility and cursor state.
 * 
 * This hook handles the delayed mounting of heavy WebGL components
 * to improve initial page load performance. It also manages the
 * custom cursor visibility based on device capabilities.
 * 
 * @param {number} delay - Delay in ms before showing WebGL (default: 100)
 * @returns {boolean} Whether the WebGL background should be rendered
 * 
 * @example
 * const showWebGL = useWebGLVisibility();
 * 
 * return (
 *   <>
 *     {showWebGL && <WebGLBackground />}
 *   </>
 * );
 */
export const useWebGLVisibility = (delay: number = 100): boolean => {
  const [showWebGL, setShowWebGL] = useState(false);

  useEffect(() => {
    // Delay WebGL mount to prioritize critical content
    const timer = setTimeout(() => {
      setShowWebGL(true);
    }, delay);

    // Enable custom cursor only on desktop non-touch devices
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    if (mediaQuery.matches && !('ontouchstart' in window)) {
      document.body.style.cursor = 'none';
    }

    return () => {
      clearTimeout(timer);
      document.body.style.cursor = 'auto';
    };
  }, [delay]);

  return showWebGL;
};
