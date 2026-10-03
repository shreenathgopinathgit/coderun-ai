import type { APIProfile } from '../store/types'
import { parseSSEStream } from './sse'
import { chatError, isChatError, type ChatError } from './errors'
import { postChat, type ChatRequestBody } from './chatClientHttp'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

/** Options for a chat completion request. */
export interface ChatStreamOptions {
  signal?: AbortSignal
  onToken?: (text: string) => void
  maxTokens?: number
  temperature?: number
  /** Retry policy for rate-limited requests. */
  retry?: RetryPolicy
  /** Additional request headers for provider-specific requirements. */
  headers?: Record<string, string>
}

/** The result of a chat completion. */
export interface ChatStreamResult {
  content: string
}

/** Retry policy for rate-limited requests. */
export interface RetryPolicy {
  maxAttempts: number
  baseDelayMs: number
}

const DEFAULT_RETRY: RetryPolicy = {
  maxAttempts: 3,
  baseDelayMs: 1000,
}

/**
 * Send a chat completion to the active profile, streaming tokens to
 * `onToken`. Retries 429s with exponential backoff (honoring
 * `Retry-After`), falls back to non-streaming when the provider does not
 * support it, and throws typed `ChatError`s for auth, rate-limit, network
 * and server failures.
 */
export async function sendChatStream(
  profile: APIProfile,
  messages: ChatMessage[],
  options: ChatStreamOptions = {},
  retry: RetryPolicy = DEFAULT_RETRY,
): Promise<ChatStreamResult> {
  return runWithRetry(profile, messages, options, retry, true, 1)
}

async function runWithRetry(
  profile: APIProfile,
  messages: ChatMessage[],
  options: ChatStreamOptions,
  retry: RetryPolicy,
  streaming: boolean,
  attempt: number,
): Promise<ChatStreamResult> {
  const body: ChatRequestBody = {
    model: profile.model,
    messages: messages as ChatRequestBody['messages'],
    stream: streaming,
  }
  if (options.maxTokens !== undefined) body.max_tokens = options.maxTokens
  if (options.temperature !== undefined) body.temperature = options.temperature

  let response: Response
  try {
    response = await postChat(profile, body, options.signal)
  } catch (e) {
    if (isChatError(e) && e.code === 'auth') throw e
    if (isChatError(e) && e.code === 'rate_limit') {
      if (attempt >= retry.maxAttempts) throw e
      const delay = retryDelayMs(e, attempt, retry.baseDelayMs)
      await sleep(delay, options.signal)
      return runWithRetry(profile, messages, options, retry, streaming, attempt + 1)
    }
    throw e
  }

  if (!streaming) {
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = json?.choices?.[0]?.message?.content
    if (typeof content !== 'string' || content.length === 0) {
      throw chatError('no_content', 'The model returned an empty response.')
    }
    options.onToken?.(content)
    return { content }
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('text/event-stream')) {
    // Provider answered without streaming — fall back to a normal request.
    return runWithRetry(profile, messages, options, retry, false, attempt)
  }

  const stream = response.body
  if (!stream) {
    throw chatError('network', 'The provider returned a streaming response with no body.')
  }

  let content = ''
  try {
    for await (const ev of parseSSEStream(stream, { signal: options.signal })) {
      if (ev.type === 'delta' && ev.content) {
        content += ev.content
        options.onToken?.(ev.content)
      } else if (ev.type === 'error') {
        throw chatError('malformed', ev.message ?? 'Malformed SSE data.')
      }
    }
  } catch (e) {
    if (isChatError(e)) throw e
    if (options.signal?.aborted) throw chatError('aborted', 'Request was cancelled.')
    throw chatError('network', `SSE stream ended unexpectedly: ${e instanceof Error ? e.message : e}`)
  }

  if (content.length === 0) {
    throw chatError('no_content', 'The model returned an empty response.')
  }
  return { content }
}

function retryDelayMs(e: ChatError, attempt: number, baseMs: number): number {
  // Some providers send `Retry-After` in seconds; honor it when present.
  const match = /retry-after:\s*(\d+)/i.exec(e.message)
  if (match) {
    const seconds = Number(match[1])
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000
  }
  return baseMs * 2 ** (attempt - 1)
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(chatError('aborted', 'Request was cancelled.'))
      return
    }
    const t = setTimeout(resolve, ms)
    const onAbort = () => {
      clearTimeout(t)
      reject(chatError('aborted', 'Request was cancelled.'))
    }
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}