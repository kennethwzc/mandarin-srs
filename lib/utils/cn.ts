/**
 * Tailwind CSS class name utility
 *
 * Combines clsx for conditional classes with tailwind-merge
 * for intelligent conflict resolution.
 *
 * Dependencies: clsx, tailwind-merge
 */

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merge Tailwind CSS classes with conflict resolution
 *
 * @param inputs - Class names to merge (strings, objects, arrays)
 * @returns Merged class string with conflicts resolved
 *
 * @example
 * ```ts
 * cn('px-4 py-2', 'px-6') // => 'py-2 px-6'
 * cn('text-red-500', condition && 'text-blue-500') // conditional classes
 * cn({ 'bg-red': isError, 'bg-green': isSuccess }) // object syntax
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
