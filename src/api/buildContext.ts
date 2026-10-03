import type { Language } from '../store/types'
import type { RunResult } from '../runner/types'
export type { RunResult }

/** One example shown in a question description. */
export interface QuestionExample {
  input: string
  output: string
  explanation?: string
}

/** One test case for a question. */
export interface TestCase {
  args: unknown[]
  expected: unknown
  hidden?: boolean
}

/** A question generated or pasted by the user. */
export interface Question {
  id: string
  title: string
  difficulty: 'easy' | 'medium' | 'hard'
  description: string
  examples?: QuestionExample[]
  constraints?: string[]
  functionName: string
  params: { name: string; type: string }[]
  returnType: string
  testCases: TestCase[]
}

/** A rolling summary of messages older than the verbatim window. */
export interface ContextSummary {
  text: string
  /** Number of messages folded into this summary. */
  count: number
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface BuildContextOptions {
  question: Question | null
  code: string
  lastRun: RunResult | null
  language: Language
  includeCode: boolean
  maxMessages: number
  maxTokens: number
  previousCodeHash: string | null
  previousSummary: ContextSummary | null
  /** Conversation history before the current user message. */
  history: ChatMessage[]
  /** The current user message, or null when building context only. */
  userMessage: string | null
}

export interface BuildContextResult {
  messages: ChatMessage[]
  /** Approximate token count of the assembled context. */
  tokenEstimate: number
  /** Hash of the code included in this context, or null if code was not sent. */
  codeHash: string | null
  /** The summary to carry forward, if any messages were collapsed. */
  summary: ContextSummary | null
}

/** The stable system prompt prefix, kept short to save tokens. */
export const SYSTEM_PROMPT =
  'You are CodeForge AI, a concise programming tutor. Answer the user\'s question directly, with short code examples. Refer to the user\'s code and question when relevant.'

const CODE_HASH_SALT = 'codeforge-ai:v1'
const CODE_TRUNCATE = 6000
const RUN_SUMMARY_LIMIT = 500
const TOKENS_PER_CHAR = 0.25

/**
 * Build the request context exactly as section 6 of the spec: a short fixed
 * system prompt, the question title and short description, the language, the
 * user's code (truncated, included only when changed or code-related), the
 * last run result summarised, the last N messages verbatim with older ones
 * collapsed into a local rolling summary, and a max_tokens cap.
 */
export function buildContext(opts: BuildContextOptions): BuildContextResult {
  const messages: ChatMessage[] = [{ role: 'system', content: SYSTEM_PROMPT }]

  const codeHash = hashString(opts.code)
  const codeChanged = opts.previousCodeHash !== codeHash
  const looksCodeRelated = isCodeRelated(opts.userMessage)

  // Question + language + code block.
  const contextLines: string[] = []
  if (opts.question) {
    contextLines.push(`Question: ${opts.question.title}`)
    if (opts.question.description) {
      contextLines.push(
        `Description: ${shortText(opts.question.description, 200)}`,
      )
    }
  }
  contextLines.push(`Language: ${opts.language}`)
  if (opts.includeCode && (codeChanged || looksCodeRelated)) {
    contextLines.push(
      `Current code:\n${opts.code.slice(0, CODE_TRUNCATE)}${opts.code.length > CODE_TRUNCATE ? '\n[truncated]' : ''}`,
    )
  } else if (opts.includeCode) {
    contextLines.push('Current code: unchanged since last message.')
  }
  if (opts.lastRun) {
    contextLines.push(summariseRun(opts.lastRun))
  }
  if (contextLines.length > 1) {
    messages.push({ role: 'user', content: contextLines.join('\n\n') })
  }

  // Conversation: rolling summary + last N verbatim messages.
  const windowed = windowHistory(opts.history, opts.userMessage, opts.maxMessages)
  messages.push(...windowed.messages)

  const tokenEstimate = estimateTokens(messages)
  return {
    messages,
    tokenEstimate,
    codeHash: opts.includeCode && (codeChanged || looksCodeRelated) ? codeHash : null,
    summary: windowed.summary ?? opts.previousSummary,
  }
}

/**
 * Keep the last `maxMessages` messages verbatim. Older messages are folded
 * into a short local summary (no extra API call) or dropped entirely.
 */
export function windowHistory(
  history: ChatMessage[],
  current: string | null,
  maxMessages: number,
): { messages: ChatMessage[]; summary: ContextSummary | null } {
  const all = current ? [...history, { role: 'user' as const, content: current }] : history
  if (all.length <= maxMessages) return { messages: all, summary: null }
  const overflow = all.length - maxMessages
  const kept = all.slice(overflow)
  const dropped = all.slice(0, overflow)
  const summaryText = dropped
    .map((m) => `${m.role}: ${shortText(m.content, 120)}`)
    .join(' | ')
  return {
    messages: [{ role: 'system', content: `Summary: ${summaryText}` }, ...kept],
    summary: { text: summaryText, count: dropped.length },
  }
}

/** Heuristic: does the user's message mention code, a function, or a bug? */
function isCodeRelated(message: string | null): boolean {
  if (!message) return false
  return /\b(code|function|error|bug|stack|trace|runtime|syntax|type\s+error|undefined)\b/i.test(message)
}

function shortText(text: string, limit: number): string {
  const collapsed = text.replace(/\s+/g, ' ').trim()
  return collapsed.length <= limit ? collapsed : `${collapsed.slice(0, limit)}...`
}

function summariseRun(run: RunResult): string {
  const passed = run.cases.filter((c) => c.passed).length
  const total = run.cases.length
  const lines: string[] = []
  lines.push(`Last run: ${passed}/${total} cases passed, ${run.timeMs}ms.`)
  if (run.timedOut) lines.push('The run hit the time limit.')
  const firstFail = run.cases.find((c) => !c.passed && !c.hidden)
  if (firstFail) {
    const detail = firstFail.error ?? 'output did not match'
    lines.push(`First failure: ${detail}`)
  }
  const summary = lines.join(' ')
  return summary.length <= RUN_SUMMARY_LIMIT
    ? summary
    : `${summary.slice(0, RUN_SUMMARY_LIMIT)}...`
}

/** Non-cryptographic hash used only to detect code changes between messages. */
function hashString(s: string): string {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return `${CODE_HASH_SALT}:${(h >>> 0).toString(16)}`
}

function estimateTokens(messages: ChatMessage[]): number {
  const chars = messages.reduce((sum, m) => sum + m.content.length, 0)
  return Math.round(chars * TOKENS_PER_CHAR)
}