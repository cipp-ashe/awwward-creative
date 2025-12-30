/**
 * useWebGLVisibility Hook
 * 
 * Manages delayed mounting of heavy WebGL components
 * to improve initial page load performance.
 * 
 * NOTE: Cursor management has been moved to useCursorVisibility hook
 * to prevent global DOM side effects and state leaks across routes.
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

import { useEffect, useState } from 'react';

export const useWebGLVisibility = (delay: number = 100): boolean => {
  const [showWebGL, setShowWebGL] = useState(false);

  useEffect(() => {
    // Delay WebGL mount to prioritize critical content
    const timer = setTimeout(() => {
      setShowWebGL(true);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [delay]);

  return showWebGL;
};
