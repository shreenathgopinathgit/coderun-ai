/**
 * Parse an OpenAI-compatible SSE (text/event-stream) response into typed
 * events. Handles chunk boundaries that split lines or JSON, the `[DONE]`
 * marker, and malformed lines (they are skipped, never fatal).
 */

export interface SSEDelta {
  content?: string
}

export interface SSEChunk {
  choices?: Array<{ delta?: SSEDelta; finish_reason?: string | null }>
}

export type SSEEventType = 'delta' | 'done' | 'error'

export interface SSEEvent {
  type: SSEEventType
  /** Text content of the delta, for type 'delta'. */
  content?: string
  /** Human-readable message, for type 'error'. */
  message?: string
}

export interface SSEStreamOptions {
  signal?: AbortSignal
}

/**
 * Yield typed events from an SSE byte stream. Each event is one blank-line
 * terminated block; `data:` lines within a block are joined with `\n`.
 */
export async function* parseSSEStream(
  stream: ReadableStream<Uint8Array>,
  options: SSEStreamOptions = {},
): AsyncGenerator<SSEEvent> {
  const reader = stream.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let eventLines: string[] = []
  let emittedAny = false

  const onAbort = () => {
    try {
      reader.cancel()
    } catch {
      /* ignore */
    }
  }
  if (options.signal) {
    if (options.signal.aborted) {
      throw new DOMException('Aborted', 'AbortError')
    }
    options.signal.addEventListener('abort', onAbort, { once: true })
  }

  /** Turn the accumulated `data:` lines into one event, or null to skip. */
  const dispatch = (): SSEEvent | null => {
    if (eventLines.length === 0) return null
    const data = eventLines.join('\n')
    eventLines = []
    if (data === '[DONE]') return { type: 'done' }
    let chunk: SSEChunk
    try {
      chunk = JSON.parse(data) as SSEChunk
    } catch {
      return {
        type: 'error',
        message: `Unparseable SSE data: ${data.slice(0, 120)}`,
      }
    }
    const content = chunk?.choices?.[0]?.delta?.content
    return typeof content === 'string' ? { type: 'delta', content } : null
  }

  try {
    while (true) {
      if (options.signal?.aborted) return
      let result: ReadableStreamReadResult<Uint8Array>
      try {
        result = await reader.read()
      } catch (e) {
        if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
        if (e instanceof DOMException && e.name === 'AbortError') throw e
        throw e
      }
      // `reader.cancel()` (from the abort listener) makes `read` resolve
      // with `done` instead of throwing, so check the signal explicitly.
      if (options.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      if (result.done) {
        buffer += decoder.decode()
        break
      }
      buffer += decoder.decode(result.value, { stream: true })

      let idx = buffer.indexOf('\n')
      while (idx >= 0) {
        const line = buffer.slice(0, idx).replace(/\r$/, '')
        buffer = buffer.slice(idx + 1)
        if (line === '') {
          const ev = dispatch()
          if (ev) yield ev
          if (ev?.type === 'done') return
        } else if (line.startsWith('data:')) {
          // SSE allows exactly one leading space after `data:`; strip it.
          eventLines.push(line.slice(5).replace(/^ /, ''))
        }
        // Comments (`:`), `event:`, `id:` and `retry:` are ignored.
        idx = buffer.indexOf('\n')
      }
    }

    // Flush a trailing data line that had no terminating blank line, then
    // emit a synthetic done so callers never hang on a stream that ends
    // without sending [DONE]. Only do this when a block was actually
    // pending — a clean empty stream yields nothing.
    let endedCleanly = false
    // Process the remaining buffer through the same line rules so a
    // trailing `data:` line is stripped and dispatched like any other.
    buffer = buffer.replace(/\r$/, '')
    const tailLines = buffer.split('\n')
    for (const raw of tailLines) {
      const line = raw.trim()
      if (line === '') {
        const ev = eventLines.length > 0 ? dispatch() : null
        if (ev) {
          yield ev
          emittedAny = true
          if (ev.type === 'done') endedCleanly = true
        }
      } else if (line.startsWith('data:')) {
        eventLines.push(line.slice(5).replace(/^ /, ''))
      }
    }
    const ev = eventLines.length > 0 ? dispatch() : null
    if (ev) {
      yield ev
      emittedAny = true
      if (ev.type === 'done') endedCleanly = true
    }
    if (!endedCleanly && emittedAny) yield { type: 'done' }
  } finally {
    if (options.signal) {
      options.signal.removeEventListener('abort', onAbort)
    }
    try {
      reader.releaseLock()
    } catch {
      /* reader may already be cancelled */
    }
  }
}