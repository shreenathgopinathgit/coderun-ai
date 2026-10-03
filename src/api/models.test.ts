import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { startMock } from '../../scripts/mock-openai.mjs'
import { fetchModels, parseModelsResponse, testConnection, formatChatError } from './models'
import type { APIProfile } from '../store/types'

let server: { address(): { port: number }; close(): void } | null = null
let base = ''

function profile(overrides: Partial<APIProfile> = {}): APIProfile {
  return {
    id: 'p1',
    name: 'Mock',
    provider: 'custom',
    baseUrl: base,
    apiKey: 'test-key',
    model: 'mock-stream',
    active: true,
    ...overrides,
  }
}

async function start(mode: string, opts: { invalidModel?: string } = {}) {
  if (server) server.close()
  server = await startMock(mode, opts as { retryAfter?: number })
  base = `http://localhost:${server.address().port}`
}

afterAll(() => {
  if (server) {
    server.close()
    server = null
  }
})

describe('parseModelsResponse', () => {
  it('parses a Mistral-shaped list and hides non-chat models', () => {
    const models = parseModelsResponse({
      object: 'list',
      data: [
        {
          id: 'mistral-small-latest',
          capabilities: { completion_chat: true },
        },
        {
          id: 'mistral-embed',
          capabilities: { completion_chat: false },
        },
      ],
    })
    expect(models.map((m) => m.id)).toEqual(['mistral-small-latest'])
    expect(models[0].usableForChat).toBe(true)
  })

  it('parses an OpenAI-shaped list (no capabilities) and keeps every model', () => {
    const models = parseModelsResponse({
      object: 'list',
      data: [
        { id: 'gpt-4o-mini' },
        { id: 'gpt-4o' },
      ],
    })
    expect(models.map((m) => m.id)).toEqual(['gpt-4o-mini', 'gpt-4o'])
    expect(models.every((m) => m.usableForChat)).toBe(true)
  })

  it('throws on a malformed response', () => {
    expect(() => parseModelsResponse({ foo: 'bar' })).toThrow(/data/)
    expect(() => parseModelsResponse(null)).toThrow(/data/)
  })
})

describe('fetchModels', () => {
  beforeAll(async () => {
    await start('models')
  })

  it('returns only chat-usable models from a Mistral-shaped endpoint', async () => {
    const models = await fetchModels(profile())
    expect(models.map((m) => m.id)).toEqual(['mistral-small-latest'])
  })

  it('returns every model from an OpenAI-shaped endpoint', async () => {
    await start('models-openai')
    const models = await fetchModels(profile())
    expect(models.map((m) => m.id)).toEqual(['gpt-4o-mini', 'gpt-4o'])
  })

  it('throws an auth error on 401', async () => {
    await start('models-401')
    await expect(fetchModels(profile())).rejects.toThrow(/rejected/)
  })
})

describe('testConnection', () => {
  it('succeeds against a streaming endpoint', async () => {
    await start('stream')
    const result = await testConnection(profile())
    expect(result).toEqual({ ok: true })
  })

  it('reports a friendly error for an invalid model', async () => {
    await start('invalid-model', { invalidModel: 'llama-3.3-70b-versatile' })
    const result = await testConnection(profile({ model: 'llama-3.3-70b-versatile' }))
    expect(result.ok).toBe(false)
    if (result.ok === false) {
      expect(result.error).toBe(
        'The provider rejected the model "llama-3.3-70b-versatile". Pick another model from the list.',
      )
    }
  })

  it('reports a friendly error for a rejected key', async () => {
    await start('401')
    const result = await testConnection(profile())
    expect(result.ok).toBe(false)
    if (result.ok === false) expect(result.error).toContain('rejected')
  })
})

describe('formatChatError', () => {
  it('maps an invalid-model error', () => {
    expect(formatChatError({ message: 'Invalid model: foo' }, 'foo')).toBe(
      'The provider rejected the model "foo". Pick another model from the list.',
    )
  })

  it('maps an auth error', () => {
    expect(formatChatError({ message: 'Invalid API key' }, 'mistral-small-latest')).toBe(
      'The API key was rejected. Check the key in your profile.',
    )
  })

  it('falls back to the raw message', () => {
    expect(formatChatError({ message: 'Something else broke' }, 'm')).toBe('Something else broke')
  })

  it('never prints the key value', () => {
    const out = formatChatError({ message: 'Invalid API key' }, 'm')
    expect(out).not.toContain('sk-123')
    expect(out).not.toMatch(/Bearer/i)
  })
})