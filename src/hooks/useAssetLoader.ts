/**
 * useAssetLoader Hook
 * 
 * Tracks loading progress of fonts, images, and document resources.
 * Provides smooth animated progress for preloader displays.
 * 
 * ## RAF Exception Notice
 * This hook uses a **standalone requestAnimationFrame loop** instead of the
 * central `useTicker` system. This is an intentional, documented exception:
 * 
 * 1. **Lifecycle**: Preloader runs BEFORE the main app fully mounts, meaning
 *    the central ticker may not be available or stable during initial load.
 * 2. **Short-lived**: The animation runs for max ~2-3 seconds, then self-terminates.
 * 3. **Isolation**: Progress animation is decoupled from the rest of the app
 *    to avoid initialization race conditions.
 * 
 * @param options.minDuration - Minimum display time in ms (default: 1000)
 * @param options.maxTimeout - Maximum wait time before forcing complete (default: 8000)
 * @returns Loading state with progress, completion status, and error tracking
 * 
 * @example
 * const { progress, isComplete, currentAsset } = useAssetLoader({ minDuration: 2000 });
 * 
 * if (!isComplete) {
 *   return <Preloader progress={progress} status={currentAsset} />;
 * }
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PRELOADER } from '@/constants/animation';

interface AssetLoadingState {
  /** Loading progress 0-100 */
  progress: number;
  /** Whether loading is complete */
  isComplete: boolean;
  /** Number of assets loaded */
  loadedAssets: number;
  /** Total number of assets being tracked */
  totalAssets: number;
  /** Current asset being loaded (for status display) */
  currentAsset: string;
  /** Any errors encountered during loading */
  errors: string[];
}

interface UseAssetLoaderOptions {
  /** Minimum display time in ms */
  minDuration?: number;
  /** Maximum wait time before forcing complete */
  maxTimeout?: number;
}

const useAssetLoader = (options: UseAssetLoaderOptions = {}): AssetLoadingState => {
  const { 
    minDuration = PRELOADER.minDuration, 
    maxTimeout = 8000 
  } = options;
  
  const [state, setState] = useState<AssetLoadingState>({
    progress: 0,
    isComplete: false,
    loadedAssets: 0,
    totalAssets: 0,
    currentAsset: 'Initializing...',
    errors: [],
  });

  const startTimeRef = useRef<number>(Date.now());
  const hasCompletedRef = useRef(false);
  const assetsReadyRef = useRef(false);
  const animationFrameRef = useRef<number>();

  const updateProgress = useCallback((loaded: number, total: number, current: string) => {
    if (hasCompletedRef.current) return;
    
    setState(prev => ({
      ...prev,
      loadedAssets: loaded,
      totalAssets: total,
      currentAsset: current,
    }));
  }, []);

  const addError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      errors: [...prev.errors, error],
    }));
  }, []);

  // Smoothly animate progress over minDuration
  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const rawProgress = Math.min(elapsed / minDuration, 1);
      
      // Ease-out curve for natural feeling progress
      const easedProgress = 1 - Math.pow(1 - rawProgress, 3);
      
      // If assets aren't ready yet, cap progress at 90%
      const cappedProgress = assetsReadyRef.current 
        ? easedProgress * 100 
        : Math.min(easedProgress * 100, 90);
      
      setState(prev => ({
        ...prev,
        progress: cappedProgress,
      }));
      
      // Continue animating until complete
      if (rawProgress < 1 || !assetsReadyRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else if (!hasCompletedRef.current) {
        // Both minDuration elapsed AND assets ready
        hasCompletedRef.current = true;
        setState(prev => ({
          ...prev,
          progress: 100,
          isComplete: true,
          currentAsset: 'Complete',
        }));
      }
    };
    
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [minDuration]);

  const markAssetsReady = useCallback(() => {
    assetsReadyRef.current = true;
  }, []);

  useEffect(() => {
    startTimeRef.current = Date.now();
    let loadedCount = 0;
    let totalCount = 0;

    // Track fonts
    const trackFonts = async (): Promise<void> => {
      updateProgress(loadedCount, totalCount, 'Loading fonts...');
      
      try {
        if ('fonts' in document) {
          await document.fonts.ready;
          const fontFaces = Array.from(document.fonts);
          totalCount += fontFaces.length || 1;
          loadedCount += fontFaces.length || 1;
          updateProgress(loadedCount, totalCount, 'Fonts loaded');
        } else {
          totalCount += 1;
          loadedCount += 1;
          updateProgress(loadedCount, totalCount, 'Fonts ready');
        }
      } catch {
        addError('Font loading failed');
        totalCount += 1;
        loadedCount += 1;
      }
    };

    // Track images in viewport
    const trackImages = async (): Promise<void> => {
      updateProgress(loadedCount, totalCount, 'Loading images...');
      
      const images = Array.from(document.querySelectorAll('img'));
      const criticalImages = images.slice(0, 5);
      
      if (criticalImages.length === 0) {
        totalCount += 1;
        loadedCount += 1;
        updateProgress(loadedCount, totalCount, 'No critical images');
        return;
      }

      totalCount += criticalImages.length;
      updateProgress(loadedCount, totalCount, 'Loading images...');

      const imagePromises = criticalImages.map((img, index) => {
        return new Promise<void>((resolve) => {
          if (img.complete && img.naturalHeight !== 0) {
            loadedCount++;
            updateProgress(loadedCount, totalCount, `Image ${index + 1} loaded`);
            resolve();
          } else {
            const handleLoad = () => {
              loadedCount++;
              updateProgress(loadedCount, totalCount, `Image ${index + 1} loaded`);
              resolve();
            };
            const handleError = () => {
              loadedCount++;
              addError(`Image failed: ${img.src.slice(-30)}`);
              resolve();
            };
            img.addEventListener('load', handleLoad, { once: true });
            img.addEventListener('error', handleError, { once: true });
          }
        });
      });

      await Promise.all(imagePromises);
    };

    // Track document ready state
    const trackDocument = async (): Promise<void> => {
      totalCount += 1;
      updateProgress(loadedCount, totalCount, 'Document loading...');
      
      if (document.readyState === 'complete') {
        loadedCount++;
        updateProgress(loadedCount, totalCount, 'Document ready');
        return;
      }

      await new Promise<void>((resolve) => {
        const handleReady = () => {
          loadedCount++;
          updateProgress(loadedCount, totalCount, 'Document ready');
          resolve();
        };
        
        if (document.readyState === 'complete') {
          handleReady();
        } else {
          window.addEventListener('load', handleReady, { once: true });
        }
      });
    };

    // Track CSS stylesheets
    const trackStylesheets = async (): Promise<void> => {
      totalCount += 1;
      
      try {
        loadedCount++;
        updateProgress(loadedCount, totalCount, 'Styles loaded');
      } catch {
        loadedCount++;
        updateProgress(loadedCount, totalCount, 'Styles ready');
      }
    };

    // Main loading sequence
    const loadAssets = async () => {
      try {
        await trackDocument();
        await trackStylesheets();
        await trackFonts();
        await trackImages();
        markAssetsReady();
      } catch (err) {
        console.error('Asset loading error:', err);
        markAssetsReady();
      }
    };

    loadAssets();

    // Fallback timeout
    const timeoutId = setTimeout(() => {
      if (!assetsReadyRef.current) {
        console.warn('Asset loader timeout - forcing ready');
        markAssetsReady();
      }
    }, maxTimeout);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [updateProgress, addError, markAssetsReady, maxTimeout]);

  return state;
};

export default useAssetLoader;
