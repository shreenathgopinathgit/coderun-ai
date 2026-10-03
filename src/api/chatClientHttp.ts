import type { APIProfile } from '../store/types'
import { chatError } from './errors'

/** The OpenAI-compatible request body we send. */
export interface ChatRequestBody {
  model: string
  messages: Array<{ role: string; content: string }>
  stream?: boolean
  max_tokens?: number
  temperature?: number
}

/**
 * POST a chat completion request. Throws a typed `ChatError` for 401, 429,
 * network/CORS failures and other 4xx/5xx responses. The caller decides
 * whether to retry or fall back.
 */
export async function postChat(
  profile: APIProfile,
  body: ChatRequestBody,
  signal?: AbortSignal,
): Promise<Response> {
  const url = `${profile.baseUrl.replace(/\/$/, '')}/chat/completions`
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${profile.apiKey}`,
  }
  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    })
  } catch (e) {
    if (signal?.aborted) throw chatError('aborted', 'Request was cancelled.')
    // fetch throws on DNS failure, refused connections and CORS blocks.
    const message =
      e instanceof Error ? e.message : 'Network request failed.'
    throw chatError('network', `Could not reach the provider: ${message}`)
  }

  if (response.status === 401) {
    throw chatError('auth', 'The API key was rejected (401). Check the key in your profile.')
  }
  if (response.status === 429) {
    const retryAfter = response.headers.get('retry-after')
    const suffix = retryAfter ? ` retry-after: ${retryAfter}` : ''
    throw chatError('rate_limit', `Rate limit reached (429).${suffix}`)
  }
  if (!response.ok) {
    const text = await readErrorBody(response)
    throw chatError('server', `Provider returned ${response.status}: ${text}`)
  }
  return response
}

async function readErrorBody(response: Response): Promise<string> {
  try {
    const text = await response.text()
    return text.slice(0, 300)
  } catch {
    return ''
  }
}