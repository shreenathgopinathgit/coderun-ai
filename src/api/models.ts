import type { APIProfile } from '../store/types'
import { chatError, isChatError } from './errors'
import { postChat, type ChatRequestBody } from './chatClientHttp'

/** One model entry from `GET {baseUrl}/models`. */
export interface ModelEntry {
  id: string
  name?: string
  description?: string
}

export interface ModelsResponse {
  data: ModelEntry[]
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
  if (!isModelsResponse(json)) {
    throw chatError('malformed', 'The models response did not have a `data` array.')
  }
  return json.data
}

/**
 * Test the connection by sending a 1-token completion request. Returns
 * success or the exact error message from the provider.
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
    const json = await response.json() as { choices?: Array<{ message?: { content?: string } }> }
    const content = json?.choices?.[0]?.message?.content
    if (typeof content !== 'string') {
      return { ok: false, error: 'Connection succeeded but the response was empty.' }
    }
    return { ok: true }
  } catch (e) {
    if (isChatError(e)) return { ok: false, error: e.message }
    return { ok: false, error: e instanceof Error ? e.message : String(e) }
  }
}

function isModelsResponse(v: unknown): v is ModelsResponse {
  return (
    typeof v === 'object' &&
    v !== null &&
    Array.isArray((v as { data?: unknown }).data)
  )
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text()
    return text.slice(0, 300)
  } catch {
    return ''
  }
}