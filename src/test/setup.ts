import { beforeEach, vi } from 'vitest'

beforeEach(() => {
  // localStorage is only present in browser-like environments; tests that
  // run against a real node server have no DOM storage to clear.
  if (typeof localStorage !== 'undefined') localStorage.clear()
  vi.unstubAllGlobals()
})