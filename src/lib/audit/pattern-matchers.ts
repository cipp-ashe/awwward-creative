/**
 * Regex patterns for detecting common issues across the codebase
 */

// ============================================================================
// ACCESSIBILITY PATTERNS
// ============================================================================

/** Detects images without alt attributes */
export const IMG_WITHOUT_ALT = /<img(?![^>]*alt=)[^>]*>/gi;

/** Detects images with empty alt (should be decorative only) */
export const IMG_EMPTY_ALT = /<img[^>]*alt=["']["'][^>]*>/gi;

/** Detects buttons without accessible names */
export const BUTTON_WITHOUT_LABEL = /<button(?![^>]*(?:aria-label|aria-labelledby))[^>]*>\s*<(?!\/button)/gi;

/** Detects cursor: none CSS */
export const CURSOR_NONE = /cursor:\s*none/gi;

/** Detects prefers-reduced-motion media query */
export const PREFERS_REDUCED_MOTION = /@media.*prefers-reduced-motion/gi;

/** Detects skip link patterns */
export const SKIP_LINK = /skip.*(?:to|link)|#main-content|sr-only.*skip/gi;

/** Detects aria-live regions */
export const ARIA_LIVE = /aria-live=["'](?:polite|assertive)["']/gi;

/** Detects focus-visible styles */
export const FOCUS_VISIBLE = /focus-visible|:focus-visible/gi;

// ============================================================================
// ANIMATION PATTERNS
// ============================================================================

/** Detects GSAP animation calls */
export const GSAP_ANIMATION = /gsap\.(to|from|fromTo|set|timeline)/gi;

/** Detects ScrollTrigger usage */
export const SCROLL_TRIGGER = /ScrollTrigger\.(?:create|refresh|update|batch)/gi;

/** Detects Framer Motion components */
export const FRAMER_MOTION = /<motion\./gi;

/** Detects AnimatePresence wrapper */
export const ANIMATE_PRESENCE = /<AnimatePresence/gi;

/** Detects infinite animations */
export const INFINITE_ANIMATION = /repeat:\s*(?:Infinity|-1)|animation:.*infinite/gi;

/** Detects scrub values in ScrollTrigger */
export const SCRUB_VALUE = /scrub:\s*([\d.]+|true)/gi;

/** Detects useFrame hook (R3F) */
export const USE_FRAME = /useFrame\s*\(/gi;

/** Detects requestAnimationFrame usage */
export const RAF_USAGE = /requestAnimationFrame/gi;

// ============================================================================
// TYPOGRAPHY PATTERNS
// ============================================================================

/** Detects clamp() usage in CSS */
export const CLAMP_USAGE = /clamp\(([^,]+),\s*([^,]+),\s*([^)]+)\)/gi;

/** Detects line-height values */
export const LINE_HEIGHT = /lineHeight:\s*["']?([\d.]+)/gi;

/** Detects letter-spacing values */
export const LETTER_SPACING = /letterSpacing:\s*["']?(-?[\d.]+em)/gi;

/** Detects font-family declarations */
export const FONT_FAMILY = /fontFamily:\s*{([^}]+)}/gi;

/** Detects uppercase text classes */
export const UPPERCASE_TEXT = /uppercase|text-uppercase|ALLCAPS/gi;

// ============================================================================
// GRID & LAYOUT PATTERNS
// ============================================================================

/** Detects hardcoded max-width values */
export const HARDCODED_MAX_WIDTH = /max-w-(?:\d+xl|\[\d+(?:px|rem)\])/gi;

/** Detects gap utility classes */
export const GAP_CLASSES = /gap-(\d+)/gi;

/** Detects padding/margin values */
export const SPACING_CLASSES = /(?:p|m)(?:x|y|t|r|b|l)?-(\d+)/gi;

/** Detects grid column definitions */
export const GRID_COLS = /grid-cols-(\d+)/gi;

// ============================================================================
// PERFORMANCE PATTERNS
// ============================================================================

/** Detects useState in high-frequency contexts */
export const USESTATE_PATTERN = /const\s*\[[^\]]+,\s*set[A-Z][^\]]+\]\s*=\s*useState/gi;

/** Detects useEffect patterns */
export const USEEFFECT_PATTERN = /useEffect\s*\(\s*\(\)\s*=>/gi;

/** Detects will-change CSS property */
export const WILL_CHANGE = /will-change:\s*[^;]+/gi;

/** Detects lazy/dynamic imports */
export const LAZY_IMPORT = /lazy\s*\(\s*\(\)\s*=>\s*import/gi;

/** Detects font loading hints */
export const FONT_DISPLAY = /font-display:\s*(swap|block|fallback|optional)/gi;

/** Detects preload links */
export const PRELOAD_LINK = /<link[^>]*rel=["']preload["'][^>]*>/gi;

// ============================================================================
// COLOR & THEMING PATTERNS
// ============================================================================

/** Detects HSL color variables */
export const HSL_VARIABLE = /--[a-z-]+:\s*([\d.]+\s+[\d.]+%\s+[\d.]+%)/gi;

/** Detects opacity modifiers on colors */
export const OPACITY_MODIFIER = /(?:primary|secondary|accent|foreground|background)\/(\d+)/gi;

/** Detects hardcoded colors (not using variables) */
export const HARDCODED_COLOR = /(?:bg|text|border)-(?:white|black|gray-\d+|red-\d+|blue-\d+)/gi;

// ============================================================================
// UX/NAVIGATION PATTERNS
// ============================================================================

/** Detects router link components */
export const ROUTER_LINK = /<(?:Link|NavLink)[^>]*to=["']([^"']+)["']/gi;

/** Detects section IDs */
export const SECTION_ID = /id=["']([^"']+)["']/gi;

/** Detects preloader duration */
export const PRELOADER_DURATION = /(?:minDuration|duration|delay):\s*(\d+)/gi;

/** Detects navigation component */
export const NAVIGATION_COMPONENT = /<(?:Nav|Navigation|NavigationBar|Header)[^>]*>/gi;
