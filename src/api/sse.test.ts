import { describe, it, expect } from 'vitest'
import { parseSSEStream, type SSEEvent } from './sse'

/** Build a ReadableStream that enqueues bytes in the given chunks. */
function streamFrom(chunks: string[]): ReadableStream<Uint8Array> {
  const enc = new TextEncoder()
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const c of chunks) controller.enqueue(enc.encode(c))
      controller.close()
    },
  })
}

async function collect(stream: ReadableStream<Uint8Array>): Promise<SSEEvent[]> {
  const out: SSEEvent[] = []
  for await (const ev of parseSSEStream(stream)) out.push(ev)
  return out
}

describe('parseSSEStream', () => {
  it('extracts delta content from a normal stream', async () => {
    const raw =
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n' +
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n' +
      'data: [DONE]\n\n'
    const events = await collect(streamFrom([raw]))
    expect(events).toEqual([
      { type: 'delta', content: 'Hello' },
      { type: 'delta', content: ' world' },
      { type: 'done' },
    ])
  })

  it('handles JSON split across chunk boundaries', async () => {
    const a = 'data: {"choices":[{"delta":{"content":"Hel'
    const b = 'lo"}}]}\n\n'
    const events = await collect(streamFrom([a, b]))
    expect(events).toEqual([{ type: 'delta', content: 'Hello' }])
  })

  it('handles a line split across chunks', async () => {
    const a = 'data: {"choices":[{"delta":{"content":"X"}}]}\n'
    const b = '\ndata: [DONE]\n\n'
    const events = await collect(streamFrom([a, b]))
    expect(events).toEqual([{ type: 'delta', content: 'X' }, { type: 'done' }])
  })

  it('joins multiple data: lines in one block with a newline', async () => {
    // SSE joins `data:` lines of one block with `\n`. Two JSON objects on
    // separate lines are therefore invalid JSON, so the parser reports an
    // error event for the block rather than merging their content.
    const raw = 'data: {"choices":[{"delta":{"content":"a"}}]}\ndata: {"choices":[{"delta":{"content":"b"}}]}\n\n'
    const events = await collect(streamFrom([raw]))
    expect(events.map((e) => e.type)).toEqual(['error'])
    expect(events[0]).toMatchObject({ type: 'error' })
  })

  it('strips a single leading space after data:', async () => {
    const events = await collect(streamFrom(['data: {"choices":[{"delta":{"content":"Z"}}]}\n\n']))
    expect(events).toEqual([{ type: 'delta', content: 'Z' }])
  })

  it('ignores comment lines and event/id/retry fields', async () => {
    const raw =
      ': comment\n' +
      'event: ping\n' +
      'id: 1\n' +
      'retry: 5000\n' +
      'data: {"choices":[{"delta":{"content":"ok"}}]}\n\n'
    const events = await collect(streamFrom([raw]))
    expect(events).toEqual([{ type: 'delta', content: 'ok' }])
  })

  it('handles a trailing data line with no blank line terminator', async () => {
    const events = await collect(streamFrom(['data: {"choices":[{"delta":{"content":"tail"}}]}']))
    expect(events).toEqual([
      { type: 'delta', content: 'tail' },
      { type: 'done' },
    ])
  })

  it('skips malformed JSON as an error event without aborting', async () => {
    const raw = 'data: not-json\n\ndata: {"choices":[{"delta":{"content":"after"}}]}\n\n'
    const events = await collect(streamFrom([raw]))
    expect(events.map((e) => e.type)).toEqual(['error', 'delta'])
    expect(events[0]).toMatchObject({ type: 'error' })
    expect(events[1]).toMatchObject({ type: 'delta', content: 'after' })
  })

  it('yields nothing for an empty stream', async () => {
    const events = await collect(streamFrom(['']))
    expect(events).toEqual([])
  })

  it('stops early on [DONE]', async () => {
    const raw = 'data: {"choices":[{"delta":{"content":"a"}}]}\n\ndata: [DONE]\n\ndata: {"choices":[{"delta":{"content":"b"}}]}\n\n'
    const events = await collect(streamFrom([raw]))
    expect(events).toEqual([{ type: 'delta', content: 'a' }, { type: 'done' }])
  })

  it('respects an abort signal', async () => {
    const controller = new AbortController()
    const enc = new TextEncoder()
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode('data: {"choices":[{"delta":{"content":"first"}}]}\n\n'))
        // Never close; the abort should stop iteration.
      },
    })
    const promise = (async () => {
      for await (const _ev of parseSSEStream(stream, { signal: controller.signal })) {
        // drain
      }
    })()
    controller.abort()
    await expect(promise).rejects.toThrow()
  })
})