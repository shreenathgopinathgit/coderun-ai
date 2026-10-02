import { deepEqual } from './deepEqual'
import { TIME_LIMIT_EXCEEDED, type CaseResult, type RunRequest, type RunResult, type TestCase } from './types'

/**
 * Run one case through an executor and produce a CaseResult. The executor
 * returns the function's return value or throws. Hidden cases only expose
 * pass/fail — their actual value and error are never returned.
 */
export async function runCase<T>(
  fn: (args: T[]) => Promise<T>,
  tc: TestCase<T>,
): Promise<Omit<CaseResult<T>, 'hidden'>> {
  const start = performance.now()
  let actual: T | undefined
  let error: string | undefined
  try {
    actual = await fn(tc.args)
  } catch (e) {
    error = e instanceof Error ? e.message : String(e)
  }
  const timeMs = Math.round(performance.now() - start)
  const passed = !error && deepEqual(actual, tc.expected)
  if (tc.hidden) {
    return { passed, timeMs }
  }
  return { passed, actual, error, timeMs }
}

/**
 * Shared harness logic. Given a request and an executor that runs one case,
 * produce a RunResult. Hidden cases only expose pass/fail.
 */
export async function runCases<T>(
  request: RunRequest<T>,
  fn: (args: T[]) => Promise<T>,
): Promise<RunResult<T>> {
  const start = performance.now()
  const cases: CaseResult<T>[] = []
  for (const tc of request.cases) {
    const r = await runCase(fn, tc)
    cases.push({ ...r, hidden: tc.hidden })
  }
  return {
    cases,
    consoleOutput: [],
    timeMs: Math.round(performance.now() - start),
  }
}

export { TIME_LIMIT_EXCEEDED }