import { transform } from 'sucrase'
import { runCode } from './runCode'
import { runCase } from './harness'
import { TIME_LIMIT_EXCEEDED, type CaseResult, type RunRequest, type RunResult, type TestCase } from './types'

interface WorkerMessage {
  id: number
  request: RunRequest
}

interface WorkerResponse {
  id: number
  result?: RunResult
  error?: string
}

/** Run the user's code in a sandbox and execute one request. */
async function runRequest(request: RunRequest): Promise<RunResult> {
  const transpiled =
    request.language === 'typescript'
      ? transform(request.code, { transforms: ['typescript'] }).code
      : request.code
  // `new Function` wraps the body, so module-level `export` is invalid there.
  const body = transpiled
    .replace(/^\s*export\s+default\s+/, '')
    .replace(/^\s*export\s+/, '')

  // No question loaded yet: run the code as a plain script. This is shared
  // with Python's plain-run path via runCode().
  if (request.cases.length === 0) {
    return runCode(request)
  }

  const fnFactory = new Function(
    `"use strict";\n${body}\nreturn typeof ${request.functionName} !== "undefined" ? ${request.functionName} : undefined`,
  )
  const fn = fnFactory() as ((...args: unknown[]) => unknown) | undefined
  if (typeof fn !== 'function') {
    throw new Error(`Function "${request.functionName}" was not defined in the code.`)
  }

  const cases: CaseResult[] = []
  for (const tc of request.cases) {
    const r = await runCase(fn as (args: unknown[]) => Promise<unknown>, tc as TestCase<unknown>)
    cases.push({ ...r, hidden: tc.hidden })
  }

  return {
    cases,
    consoleOutput: [],
    timeMs: 0,
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