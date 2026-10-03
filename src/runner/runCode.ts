import { transform } from 'sucrase'
import { type RunRequest, type RunResult } from './types'

/**
 * Extract the 1-based line number of the user's code where an error was
 * thrown. The user code runs inside an anonymous `new Function` frame, so
 * the stack reads `at <anonymous>:LINE:COL`. Other runtimes (Pyodide) format
 * their stacks differently and are not affected by this helper.
 */
export function extractLine(error: unknown): number | undefined {
  const stack = error instanceof Error ? error.stack : undefined
  if (!stack) return undefined
  // The stack holds several `<anonymous>:line:col` frames; the innermost —
  // the last one — is where the error was actually thrown.
  const matches = [...stack.matchAll(/<anonymous>:(\d+):\d+/g)]
  const last = matches[matches.length - 1]
  return last ? Number(last[1]) : undefined
}

/**
 * Run a plain script (no test cases) for JS/TS. The code is transpiled in
 * the worker, executed as a module body, console.log is captured, and any
 * runtime error is reported with its line number. The function-call harness
 * is used only when a question with a functionName and test cases exists.
 */
export async function runCode(request: RunRequest): Promise<RunResult> {
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
    lines.push(args.map((a) => (a === null ? 'null' : a === undefined ? 'undefined' : typeof a === 'string' ? a : JSON.stringify(a))).join(' '))
  }

  const start = performance.now()
  try {
    new Function(`"use strict";\n${body}`)()
    return {
      cases: [],
      consoleOutput: lines,
      timeMs: Math.round(performance.now() - start),
    }
  } catch (e) {
    const line = extractLine(e)
    const message = e instanceof Error ? e.message : String(e)
    const error = line ? `${message} (line ${line})` : message
    // The error is console output: it shows in the Console tab even when
    // nothing was logged, and the single case reports it in Results.
    lines.push(error)
    return {
      cases: [
        { passed: false, error, timeMs: Math.round(performance.now() - start), hidden: false },
      ],
      consoleOutput: lines,
      timeMs: Math.round(performance.now() - start),
    }
  } finally {
    // eslint-disable-next-line no-console
    console.log = originalLog
  }
}