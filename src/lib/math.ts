/**
 * Math Utilities
 * 
 * Common mathematical functions for animations and interactions.
 */

/**
 * Linear interpolation between two values.
 * 
 * @param start - Starting value
 * @param end - Ending value
 * @param factor - Interpolation factor (0 = start, 1 = end)
 * @returns Interpolated value
 * 
 * @example
 * lerp(0, 100, 0.5) // 50
 * lerp(0, 100, 0.25) // 25
 */
export const lerp = (start: number, end: number, factor: number): number => {
  return start + (end - start) * factor;
};

/**
 * Clamps a value between a minimum and maximum.
 * 
 * @param value - Value to clamp
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 * 
 * @example
 * clamp(150, 0, 100) // 100
 * clamp(-10, 0, 100) // 0
 */
export const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Maps a value from one range to another.
 * 
 * @param value - Value to map
 * @param inMin - Input range minimum
 * @param inMax - Input range maximum
 * @param outMin - Output range minimum
 * @param outMax - Output range maximum
 * @returns Mapped value
 * 
 * @example
 * mapRange(50, 0, 100, 0, 1) // 0.5
 * mapRange(0.5, 0, 1, 0, 100) // 50
 */
export const mapRange = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
): number => {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
};

/**
 * Normalizes a value to a 0-1 range.
 * 
 * @param value - Value to normalize
 * @param min - Minimum of the range
 * @param max - Maximum of the range
 * @returns Normalized value (0-1)
 */
export const normalize = (value: number, min: number, max: number): number => {
  return (value - min) / (max - min);
};

/**
 * Returns a random number between min and max.
 * 
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (exclusive)
 * @returns Random number
 */
export const random = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

/**
 * Returns a random integer between min and max (inclusive).
 * 
 * @param min - Minimum value (inclusive)
 * @param max - Maximum value (inclusive)
 * @returns Random integer
 */
export const randomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

/**
 * Calculates the distance between two points.
 * 
 * @param x1 - First point X
 * @param y1 - First point Y
 * @param x2 - Second point X
 * @param y2 - Second point Y
 * @returns Distance between points
 */
export const distance = (x1: number, y1: number, x2: number, y2: number): number => {
  return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
};

/**
 * Converts degrees to radians.
 */
export const degToRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Converts radians to degrees.
 */
export const radToDeg = (radians: number): number => {
  return radians * (180 / Math.PI);
};
