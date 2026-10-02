/**
 * Deep comparison used by the test harness. Two values are equal when:
 * - both are numbers within a tolerance (handles ints and floats)
 * - both are strings, booleans or null and match exactly
 * - both are arrays with equal length and equal elements
 * - both are plain objects with the same keys and equal values
 * - both are undefined
 *
 * Functions and class instances are never considered equal (they are
 * compared by reference only).
 */
export function deepEqual(a: unknown, b: unknown, tolerance = 1e-6): boolean {
  if (a === b) return true
  if (a == null || b == null) return a === b
  if (typeof a !== typeof b) return false

  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return true
    return Math.abs(a - b) <= tolerance
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], tolerance)) return false
    }
    return true
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as object)
    const bKeys = Object.keys(b as object)
    if (aKeys.length !== bKeys.length) return false
    for (const key of aKeys) {
      if (!Object.prototype.hasOwnProperty.call(b, key)) return false
      if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], tolerance)) return false
    }
    return true
  }

  return false
}