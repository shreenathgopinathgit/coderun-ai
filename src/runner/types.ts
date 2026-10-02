/** One test case for a question. */
export interface TestCase<T = unknown> {
  args: T[]
  expected: T
  hidden?: boolean
}

/** A single test case result returned by the harness. */
export interface CaseResult<T = unknown> {
  passed: boolean
  /** Actual return value. Only present for visible (non-hidden) cases. */
  actual?: T
  /** Error message if the function threw. */
  error?: string
  /** Wall-clock time in milliseconds for this case. */
  timeMs: number
  /** True when the case was hidden and its data must not be exposed. */
  hidden?: boolean
}

/** Result of running the whole question. */
export interface RunResult<T = unknown> {
  cases: CaseResult<T>[]
  /** Captured console.log output, one line per call. */
  consoleOutput: string[]
  /** Wall-clock time in milliseconds for the whole run. */
  timeMs: number
  /** Set when the run was terminated by the time limit. */
  timedOut?: boolean
}

/** A request to run a question. */
export interface RunRequest<T = unknown> {
  code: string
  functionName: string
  cases: TestCase<T>[]
  /** Hard timeout in milliseconds. */
  timeoutMs?: number
  /** Language of the code being run. */
  language: 'javascript' | 'typescript'
}

/** A sentinel returned when a run exceeds the time limit. */
export const TIME_LIMIT_EXCEEDED = 'Time Limit Exceeded'

/**
 * A Runner runs user code for one language. Other languages (Python,
 * remote executors) plug in behind this interface later.
 */
export interface Runner {
  run(request: RunRequest): Promise<RunResult>
}