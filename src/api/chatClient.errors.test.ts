// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startMock } from '../../scripts/mock-openai.mjs'
import { sendChatStream } from './chatClient'
import { fetchModels, testConnection } from './models'
import type { APIProfile } from '../store/types'

let server: { address(): { port: number }; close(): void } | null = null
let base = ''

function profile(): APIProfile {
  return {
    id: 'p1',
    name: 'Mock',
    provider: 'custom',
    baseUrl: base,
    apiKey: 'test-key',
    model: 'mock-stream',
    active: true,
  }
}

async function start(mode: string, opts: { retryAfter?: number } = {}) {
  if (server) server.close()
  server = await startMock(mode, opts)
  base = `http://localhost:${server.address().port}`
}

afterAll(() => {
  if (server) {
    server.close()
    server = null
  }
})

describe('chat client errors', () => {
  it('throws an auth error on 401', async () => {
    await start('401')
    await expect(
      sendChatStream(profile(), [{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(/rejected/)
  })

  it('retries a 429 and succeeds', async () => {
    await start('429', { retryAfter: 0.05 })
    const result = await sendChatStream(
      profile(),
      [{ role: 'user', content: 'hi' }],
      { retry: { maxAttempts: 3, baseDelayMs: 50 } },
    )
    expect(result.content).toBe('Hello from the mock server.')
  })

  it('falls back to non-streaming when the body is not SSE', async () => {
    await start('nostream')
    const result = await sendChatStream(profile(), [
      { role: 'user', content: 'hi' },
    ])
    expect(result.content).toBe('plain json reply')
  })

  it('reports a network error for a closed port', async () => {
    // No server started on this port; the connection is refused.
    base = 'http://localhost:1'
    await expect(
      sendChatStream(profile(), [{ role: 'user', content: 'hi' }]),
    ).rejects.toThrow(/Could not reach the provider/)
  })
})

describe('models and connection', () => {
  beforeAll(async () => {
    await start('stream')
  })

  it('fetches the model list', async () => {
    const models = await fetchModels(profile())
    expect(models.map((m) => m.id)).toEqual(['mock-stream', 'mock-chat'])
  })

  it('tests the connection successfully', async () => {
    const result = await testConnection(profile())
    expect(result).toEqual({ ok: true })
  })

  it('reports a 401 on test connection', async () => {
    await start('401')
    const result = await testConnection(profile())
    expect(result.ok).toBe(false)
    if (result.ok === false) expect(result.error).toContain('rejected')
  })
})