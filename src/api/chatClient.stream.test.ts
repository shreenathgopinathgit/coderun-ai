// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startMock } from '../../scripts/mock-openai.mjs'
import { sendChatStream } from './chatClient'
import type { APIProfile } from '../store/types'

let server: { address(): { port: number }; close(): void } | null = null

const profile: APIProfile = {
  id: 'p1',
  name: 'Mock',
  provider: 'custom',
  baseUrl: '',
  apiKey: 'test-key',
  model: 'mock-stream',
  active: true,
}

beforeAll(async () => {
  server = await startMock('stream')
  profile.baseUrl = `http://localhost:${server.address().port}`
})

afterAll(() => {
  if (server) {
    server.close()
    server = null
  }
})

describe('sendChatStream (streaming)', () => {
  it('assembles tokens from a streaming response', async () => {
    const tokens: string[] = []
    const result = await sendChatStream(
      profile,
      [{ role: 'user', content: 'hi' }],
      { onToken: (t) => tokens.push(t) },
    )
    expect(result.content).toBe('Hello from the mock server.')
    expect(tokens).toEqual(['Hello', ' from', ' the', ' mock', ' server.'])
  })

  it('aborts a streaming request', async () => {
    const controller = new AbortController()
    const promise = sendChatStream(
      profile,
      [{ role: 'user', content: 'hi' }],
      { signal: controller.signal },
    )
    controller.abort()
    await expect(promise).rejects.toThrow()
  })
})