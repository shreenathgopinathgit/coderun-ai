import { loadPyodide } from 'https://cdn.jsdelivr.net/npm/pyodide@314.0.7/pyodide.mjs'
import { deepEqual } from './deepEqual'
import { type CaseResult, type RunRequest, type RunResult } from './types'

/** Minimal surface of the Pyodide API the worker uses. */
interface PyodideApi {
  runPython(code: string): unknown
  setStdout(options: StdioOptions): void
  setStderr(options: StdioOptions): void
  globals: {
    set(key: string, value: unknown): void
    get(key: string): { toJs(): unknown }
  }
}

type StdioOptions = { batched?: ((message: string) => void) | undefined }

let pyodide: PyodideApi | null = null

async function ensurePyodide(): Promise<PyodideApi> {
  if (pyodide) return pyodide
  pyodide = (await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/npm/pyodide@314.0.7/',
  })) as unknown as PyodideApi
  return pyodide
}

async function runRequest(request: RunRequest): Promise<RunResult> {
  const py = await ensurePyodide()
  const lines: string[] = []
  const writeHandler = (message: string) => {
    lines.push(message.replace(/\n$/, ''))
  }
  py.setStdout({ batched: writeHandler })
  py.setStderr({ batched: writeHandler })

  const start = performance.now()
  try {
    py.runPython(request.code)
    py.globals.set('_cases_json', JSON.stringify(request.cases))
    py.globals.set('_fnName', request.functionName)

    py.runPython(`
import json
_cases = json.loads(_cases_json)
def _run_one(fn, case):
    import time, traceback
    start = time.perf_counter()
    actual = None
    error = None
    try:
        actual = fn(*case["args"])
    except Exception:
        error = traceback.format_exc()
    time_ms = round((time.perf_counter() - start) * 1000)
    return {"actual": actual, "error": error, "timeMs": time_ms}

_fn = globals()[_fnName]
_out = [_run_one(_fn, c) for c in _cases]
    `)

    const out = py.globals.get('_out').toJs() as Array<{
      actual: unknown
      error: string | null
      timeMs: number
    }>
    const cases: CaseResult[] = []
    for (let i = 0; i < out.length; i++) {
      const r = out[i]
      const tc = request.cases[i]
      const passed = !r.error && deepEqual(r.actual, tc.expected)
      cases.push(
        tc.hidden
          ? { passed, timeMs: r.timeMs, hidden: true }
          : { passed, actual: r.actual, error: r.error ?? undefined, timeMs: r.timeMs, hidden: false },
      )
    }

    return {
      cases,
      consoleOutput: lines,
      timeMs: Math.round(performance.now() - start),
    }
  } finally {
    py.setStdout({})
    py.setStderr({})
  }
}

self.onmessage = (e: MessageEvent<{ id: number; request: RunRequest }>) => {
  const { id, request } = e.data
  self.postMessage({ id, loading: true })
  ensurePyodide()
    .then(() => runRequest(request))
    .then((result) => self.postMessage({ id, result }))
    .catch((err) =>
      self.postMessage({ id, error: err instanceof Error ? err.message : String(err) }),
    )
}