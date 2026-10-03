import { transform } from 'sucrase'
import { deepEqual } from './deepEqual'
import { TIME_LIMIT_EXCEEDED, type CaseResult, type RunRequest, type RunResult } from './types'

interface WorkerMessage {
  id: number
  request: RunRequest
}

interface WorkerResponse {
  id: number
  result?: RunResult
  error?: string
}

/** Format a console argument for display. */
function formatArg(arg: unknown): string {
  if (arg === null) return 'null'
  if (arg === undefined) return 'undefined'
  if (typeof arg === 'string') return arg
  try {
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

/** Run the user's code in a sandbox and execute one case. */
async function runRequest(request: RunRequest): Promise<RunResult> {
  const transpiled =
    request.language === 'typescript'
      ? transform(request.code, { transforms: ['typescript'] }).code
      : request.code
  // `new Function` wraps the body, so module-level `export` is invalid there.
  const body = transpiled
    .replace(/^\s*export\s+default\s+/, '')
    .replace(/^\s*export\s+/, '')

  const lines: string[] = []
  // eslint-disable-next-line no-console -- the worker intentionally captures console.log
  const originalLog = console.log
  // eslint-disable-next-line no-console
  console.log = (...args: unknown[]) => {
    lines.push(args.map(formatArg).join(' '))
  }

  const start = performance.now()
  try {
    const fnFactory = new Function(
      `"use strict";\n${body}\nreturn typeof ${request.functionName} !== "undefined" ? ${request.functionName} : undefined`,
    )
    const fn = fnFactory() as ((...args: unknown[]) => unknown) | undefined
    if (typeof fn !== 'function') {
      throw new Error(`Function "${request.functionName}" was not defined in the code.`)
    }

    const cases: CaseResult[] = []
    if (request.cases.length === 0) {
      // No question loaded yet: run the function once so console output and
      // runtime errors are still captured and reported.
      const caseStart = performance.now()
      let actual: unknown
      let error: string | undefined
      try {
        actual = await Reflect.apply(fn, null, [])
      } catch (e) {
        error = e instanceof Error ? e.message : String(e)
      }
      const timeMs = Math.round(performance.now() - caseStart)
      cases.push({ passed: false, actual, error, timeMs, hidden: false })
    } else {
      for (const tc of request.cases) {
        const caseStart = performance.now()
        let actual: unknown
        let error: string | undefined
        try {
          actual = await Reflect.apply(fn, null, tc.args as unknown[])
        } catch (e) {
          error = e instanceof Error ? e.message : String(e)
        }
        const timeMs = Math.round(performance.now() - caseStart)
        const passed = !error && deepEqual(actual, tc.expected)
        cases.push(
          tc.hidden
            ? { passed, timeMs, hidden: true }
            : { passed, actual, error, timeMs, hidden: false },
        )
      }
    }

    return {
      cases,
      consoleOutput: lines,
      timeMs: Math.round(performance.now() - start),
    }
  } finally {
    // eslint-disable-next-line no-console
    console.log = originalLog
  }
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const { id, request } = e.data
  runRequest(request)
    .then((result) => {
      const msg: WorkerResponse = { id, result }
      self.postMessage(msg)
    })
    .catch((err) => {
      const msg: WorkerResponse = { id, error: err instanceof Error ? err.message : String(err) }
      self.postMessage(msg)
    })
}

export { TIME_LIMIT_EXCEEDED }