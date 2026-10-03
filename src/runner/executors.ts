import { JSTSWRunnerClient } from './client'
import { PyodideRunnerClient } from './pyClient'
import { type Runner, type RunRequest, type RunResult } from './types'

/** Honest message shown in the Console tab for languages without an executor. */
export const NO_EXECUTOR = 'No executor is configured for this language. Add a Judge0 or Piston compatible endpoint to use it.'

/** Runner that reports an honest "not configured" message in the Console tab. */
class StubRunner implements Runner {
  async run(_request: RunRequest): Promise<RunResult> {
    return {
      cases: [],
      consoleOutput: [NO_EXECUTOR],
      timeMs: 0,
    }
  }

  stop(): void {
    // No worker to terminate.
  }
}

/**
 * Registry of runners per language. JavaScript and TypeScript share the
 * JS/TS worker; Python uses Pyodide. Other languages are stubs until a
 * remote executor is configured.
 */
export const runners: Record<string, Runner> = {
  javascript: new JSTSWRunnerClient(),
  typescript: new JSTSWRunnerClient(),
  python: new PyodideRunnerClient(),
  java: new StubRunner(),
  c: new StubRunner(),
  cpp: new StubRunner(),
  go: new StubRunner(),
  rust: new StubRunner(),
}

export function runnerFor(language: string): Runner {
  const runner = runners[language]
  if (!runner) throw new Error(`No runner for language: ${language}`)
  return runner
}

export function runLanguage(language: string, request: RunRequest): Promise<RunResult> {
  const runner = runners[language]
  if (!runner) {
    return Promise.reject(new Error(`No runner for language: ${language}`))
  }
  return runner.run(request)
}