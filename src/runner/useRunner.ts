import { useState } from 'react'
import { runnerFor } from './executors'
import { TIME_LIMIT_EXCEEDED, type RunRequest, type RunResult } from './types'

export interface RunState {
  result: RunResult | null
  error: string | null
  loading: boolean
  pyLoading: boolean
  pyError: string | null
  timedOut: boolean
}

const INITIAL: RunState = {
  result: null,
  error: null,
  loading: false,
  pyLoading: false,
  pyError: null,
  timedOut: false,
}

/**
 * Hook that runs code through the configured runner. With no question
 * loaded, Run executes the editor code alone (no test cases). When a
 * question with test cases exists, Run executes the visible cases and
 * Submit executes all cases including hidden ones.
 */
export function useRunner() {
  const [state, setState] = useState<RunState>(INITIAL)

  const run = async (request: RunRequest): Promise<void> => {
    const runner = runnerFor(request.language)
    setState({ ...INITIAL, loading: true, pyLoading: runner.isLoading ?? false })
    try {
      const result = await runner.run(request)
      setState({
        ...INITIAL,
        result,
        pyLoading: runner.isLoading ?? false,
        pyError: runner.lastLoadError ?? null,
      })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      const pyError = runner.lastLoadError ?? null
      if (message === TIME_LIMIT_EXCEEDED) {
        setState({ ...INITIAL, timedOut: true, pyError })
        return
      }
      // A Pyodide CDN failure is reported as a load error, not a code error.
      setState({ ...INITIAL, error: pyError ? null : message, pyError })
    }
  }

  const stop = (language: string): void => {
    const runner = runnerFor(language)
    runner.stop()
    setState(INITIAL)
  }

  const clear = (): void => {
    setState(INITIAL)
  }

  /** Show an honest message in the Console tab without running any code. */
  const report = (message: string): void => {
    setState({ ...INITIAL, error: message })
  }

  return { state, run, stop, clear, report }
}

export { TIME_LIMIT_EXCEEDED }