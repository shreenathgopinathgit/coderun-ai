/** Discriminated error codes thrown by the chat client. */
export type ChatErrorCode =
  | 'auth'
  | 'rate_limit'
  | 'network'
  | 'server'
  | 'aborted'
  | 'malformed'
  | 'no_content'

/** A chat error that carries a stable `code` for the UI to act on. */
export interface ChatError extends Error {
  code: ChatErrorCode
}

export function chatError(code: ChatErrorCode, message: string): ChatError {
  const e = new Error(message) as ChatError & { code: ChatErrorCode }
  e.code = code
  return e
}

/** Type guard for chat errors thrown across the client. */
export function isChatError(v: unknown): v is ChatError {
  return v instanceof Error && 'code' in v && typeof (v as { code?: unknown }).code === 'string'
}