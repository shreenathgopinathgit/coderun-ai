import { WorkerClient, type WorkerLike } from './client'
import { type RunRequest, type RunResult } from './types'

/** Create the Pyodide runner worker. */
export function createPyodideWorker(): WorkerLike {
  return new Worker(new URL('./pyWorker.ts', import.meta.url), { type: 'module' })
}

/**
 * Client for the Pyodide runner worker. Pyodide is loaded lazily on the
 * first run from the jsDelivr CDN. On timeout the worker is terminated
 * and recreated; the Pyodide runtime reloads on the next run.
 */
export class PyodideRunnerClient extends WorkerClient {
  private loading = false
  private loadError: string | null = null

  constructor() {
    super(createPyodideWorker)
  }

  /** True while the Pyodide runtime is loading. */
  get isLoading(): boolean {
    return this.loading
  }

  /** The last load error, if the CDN could not be reached. */
  get lastLoadError(): string | null {
    return this.loadError
  }

  async run(request: RunRequest): Promise<RunResult> {
    this.loadError = null
    this.loading = true
    const timeoutMs = request.timeoutMs ?? 5000
    const id = this.nextId++
    const worker = this.ensureWorker()

    return new Promise<RunResult>((resolve, reject) => {
      const pending = { resolve, reject }
      this.pending.set(id, pending)
      let armed = false
      const arm = () => {
        if (armed) return
        armed = true
        this.timeoutHandle = setTimeout(() => {
          const p = this.pending.get(id)
          if (!p) return
          this.pending.delete(id)
          this.terminate()
          p.reject(new Error('Time Limit Exceeded'))
        }, timeoutMs)
      }
      worker.postMessage({ id, request })
      // The worker signals when loading finishes; only then arm the timeout
      // so the runtime download is not counted against the run.
      const original = worker.onmessage
      worker.onmessage = (e: MessageEvent) => {
        const data = e.data as { id: number; result?: RunResult; error?: string; loading?: boolean }
        if (data.loading) {
          this.loadError = null
          return
        }
        worker.onmessage = original
        arm()
        original?.(e)
      }
    }).finally(() => {
      this.loading = false
    })
  }

  protected ensureWorker(): WorkerLike {
    if (!this.worker) {
      this.worker = this.createWorker()
    }
    this.worker.onmessage = (e: MessageEvent) => {
      const data = e.data as { id: number; result?: RunResult; error?: string }
      const pending = this.pending.get(data.id)
      if (!pending) return
      this.pending.delete(data.id)
      this.clearTimeout()
      if (data.error) {
        this.loadError = data.error
        pending.reject(new Error(data.error))
      } else if (data.result) {
        pending.resolve(data.result)
      }
    }
    this.worker.onerror = (e) => {
      this.loadError = e.message || 'Worker error'
      this.terminate()
      for (const [, p] of this.pending) p.reject(new Error(this.loadError))
      this.pending.clear()
    }
    return this.worker
  }
}