/**
 * Motion configuration with reduced-motion support
 * Detects user's motion preferences and provides appropriate variants
 */

import { useState, useEffect } from 'react'

/**
 * Hook to detect user's motion preference
 * Returns true if user prefers reduced motion
 * Reactively updates if preference changes
 */
export function useMotionPreference(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches)
    }

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
    // Fallback for older browsers
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }

    return undefined
  }, [])

  return prefersReducedMotion
}

/**
 * Get transition configuration based on motion preference
 * @param prefersReducedMotion - Whether user prefers reduced motion
 * @returns Transition configuration object
 */
export function getTransition(prefersReducedMotion: boolean) {
  if (prefersReducedMotion) {
    return { duration: 0.15 }
  }

  return {
    duration: 0.4,
    ease: [0.16, 1, 0.3, 1] as const, // ease-out-expo
  }
}

/**
 * Get feedback variant for slide-up animations
 * @param prefersReducedMotion - Whether user prefers reduced motion
 * @returns Motion variant object
 */
export function getFeedbackVariant(prefersReducedMotion: boolean) {
  return {
    initial: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : 20,
    },
    animate: {
      opacity: 1,
      y: 0,
    },
    exit: {
      opacity: 0,
      y: prefersReducedMotion ? 0 : -10,
    },
    transition: getTransition(prefersReducedMotion),
  }
}

/**
 * Get scale variant for scale animations
 * @param prefersReducedMotion - Whether user prefers reduced motion
 * @returns Motion variant object
 */
export function getScaleVariant(prefersReducedMotion: boolean) {
  return {
    initial: {
      opacity: 0,
      scale: prefersReducedMotion ? 1 : 0.95,
    },
    animate: {
      opacity: 1,
      scale: 1,
    },
    transition: getTransition(prefersReducedMotion),
  }
}

/**
 * Get icon entrance variant
 * @param prefersReducedMotion - Whether user prefers reduced motion
 * @param delay - Animation delay in seconds
 * @returns Motion variant object
 */
export function getIconVariant(prefersReducedMotion: boolean, delay = 0.15) {
  return {
    initial: {
      scale: prefersReducedMotion ? 1 : 0.8,
      opacity: 0,
    },
    animate: {
      scale: 1,
      opacity: 1,
    },
    transition: {
      ...getTransition(prefersReducedMotion),
      delay,
    },
  }
}
