import { TIME_LIMIT_EXCEEDED, type RunRequest, type RunResult } from './types'

interface Pending {
  resolve: (result: RunResult) => void
  reject: (error: Error) => void
}

/** Default hard timeout for a run. */
export const DEFAULT_TIMEOUT_MS = 5000

/** A minimal Worker contract the client depends on. */
export interface WorkerLike {
  onmessage: ((e: MessageEvent) => void) | null
  onerror: ((e: ErrorEvent) => void) | null
  postMessage(message: unknown): void
  terminate(): void
}

/** Create the real JS/TS runner worker. */
export function createRunnerWorker(): WorkerLike {
  return new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' })
}

/**
 * Client for the JS/TS runner worker. On timeout the worker is terminated
 * and recreated, and the run is reported as Time Limit Exceeded. An
 * infinite loop can never freeze the page.
 */
export class JSTSWRunnerClient {
  private worker: WorkerLike | null = null
  private nextId = 1
  private pending = new Map<number, Pending>()
  private timeoutHandle: ReturnType<typeof setTimeout> | null = null

  constructor(private readonly createWorker: () => WorkerLike = createRunnerWorker) {}

  private ensureWorker(): WorkerLike {
    if (this.worker) return this.worker
    this.worker = this.createWorker()
    this.worker.onmessage = (e: MessageEvent) => {
      const data = e.data as { id: number; result?: RunResult; error?: string }
      const pending = this.pending.get(data.id)
      if (!pending) return
      this.pending.delete(data.id)
      this.clearTimeout()
      if (data.error) {
        pending.reject(new Error(data.error))
      } else if (data.result) {
        pending.resolve(data.result)
      }
    }
    this.worker.onerror = (e) => {
      this.terminate()
      for (const [, p] of this.pending) {
        p.reject(new Error(e.message || 'Worker error'))
      }
      this.pending.clear()
    }
    return this.worker
  }

  private clearTimeout(): void {
    if (this.timeoutHandle !== null) {
      clearTimeout(this.timeoutHandle)
      this.timeoutHandle = null
    }
  }

  private armTimeout(id: number, timeoutMs: number): void {
    this.timeoutHandle = setTimeout(() => {
      const pending = this.pending.get(id)
      if (!pending) return
      this.pending.delete(id)
      this.terminate()
      pending.reject(new Error(TIME_LIMIT_EXCEEDED))
    }, timeoutMs)
  }

  private terminate(): void {
    this.clearTimeout()
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }

  async run(request: RunRequest): Promise<RunResult> {
    const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS
    const id = this.nextId++
    const worker = this.ensureWorker()

    return new Promise<RunResult>((resolve, reject) => {
      const pending: Pending = { resolve, reject }
      this.pending.set(id, pending)
      this.armTimeout(id, timeoutMs)
      worker.postMessage({ id, request })
    })
  }

  dispose(): void {
    this.clearTimeout()
    this.terminate()
    this.pending.clear()
  }
}