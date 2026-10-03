import type { APIProfile } from '../store/types'
import { chatError, isChatError } from './errors'
import { postChat, type ChatRequestBody } from './chatClientHttp'

/** One model entry from `GET {baseUrl}/models`. */
export interface ModelEntry {
  id: string
  name?: string
  description?: string
  /** True when the model can answer chat completions. Absent = usable. */
  usableForChat: boolean
}

/**
 * Parse a `/models` response. The OpenAI shape is `{ object, data: [{ id, ... }] }`.
 * The Mistral shape adds `capabilities.completion_chat` — a model without it
 * (or with it false) is not usable for chat completions and is hidden.
 */
export function parseModelsResponse(json: unknown): ModelEntry[] {
  const data = (json as { data?: unknown[] } | null)?.data
  if (!Array.isArray(data)) {
    throw chatError('malformed', 'The models response did not have a `data` array.')
  }
  return data
    .map((entry) => toModelEntry(entry))
    .filter((entry): entry is ModelEntry => entry !== null && entry.usableForChat)
}

/**
 * Fetch the list of models available on the active profile's endpoint.
 * Throws a typed `ChatError` on auth, network or server failures.
 */
export async function fetchModels(profile: APIProfile): Promise<ModelEntry[]> {
  const url = `${profile.baseUrl.replace(/\/$/, '')}/models`
  let response: Response
  try {
    response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${profile.apiKey}`,
        'Content-Type': 'application/json',
      },
    })
  } catch (e) {
    if (e instanceof TypeError) {
      throw chatError('network', `Could not reach the provider: ${e.message}`)
    }
    throw e
  }

  if (response.status === 401) {
    throw chatError('auth', 'The API key was rejected (401). Check the key in your profile.')
  }
  if (!response.ok) {
    const text = await readErrorBody(response)
    throw chatError('server', `Provider returned ${response.status}: ${text}`)
  }

  let json: unknown
  try {
    json = await response.json()
  } catch {
    throw chatError('malformed', 'The models response was not valid JSON.')
  }
  return parseModelsResponse(json)
}

/**
 * Test the connection by sending a 1-token completion request. Returns
 * success or a friendly, plain-text error message.
 */
export async function testConnection(
  profile: APIProfile,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const body: ChatRequestBody = {
    model: profile.model,
    messages: [{ role: 'user', content: 'hi' }],
    stream: false,
    max_tokens: 1,
  }
  try {
    const response = await postChat(profile, body)
    const json = await response.json() as { error?: { message?: string }; choices?: Array<{ message?: { content?: string } }> }
    if (json?.error) {
      return { ok: false, error: formatChatError(json.error, profile.model) }
    }
    const content = json?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      return { ok: false, error: 'Connection succeeded but the response was empty.' }
    }
    return { ok: true }
  } catch (e) {
    if (isChatError(e)) {
      return { ok: false, error: formatChatError({ message: e.message }, profile.model) }
    }
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

/** Turn an OpenAI-style error body into a friendly, plain-text message. */
export function formatChatError(
  error: { message?: string } | null | undefined,
  model: string,
): string {
  const message = error?.message ?? ''
  if (/invalid model/i.test(message)) {
    return `The provider rejected the model "${model}". Pick another model from the list.`
  }
  if (/api key|invalid api key|unauthorized/i.test(message)) {
    return 'The API key was rejected. Check the key in your profile.'
  }
  if (message) return message
  return 'The provider rejected the request.'
}

function toModelEntry(entry: unknown): ModelEntry | null {
  if (typeof entry !== 'object' || entry === null) return null
  const e = entry as Record<string, unknown>
  if (typeof e.id !== 'string' || !e.id) return null
  const caps = e.capabilities as Record<string, unknown> | undefined
  // Mistral: capabilities.completion_chat marks chat-capable models.
  const usable = caps && typeof caps.completion_chat === 'boolean'
    ? caps.completion_chat !== false
    : true
  return {
    id: e.id,
    name: typeof e.name === 'string' ? e.name : undefined,
    description: typeof e.description === 'string' ? e.description : undefined,
    usableForChat: usable,
  }
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text()
    return text.slice(0, 300)
  } catch {
    return ''
  }
}