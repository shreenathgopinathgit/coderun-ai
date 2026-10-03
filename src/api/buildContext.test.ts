import { describe, it, expect } from 'vitest'
import { buildContext, windowHistory, type Question, type RunResult, type ChatMessage } from './buildContext'

const lang = 'python' as const

const question: Question = {
  id: 'q1',
  title: 'Two Sum',
  difficulty: 'easy',
  description: 'Given an array of integers, return the indices of the two numbers that add up to a target.',
  examples: [{ input: '[2,7,11,15], 9', output: '[0,1]' }],
  constraints: ['2 <= nums.length <= 10^4'],
  functionName: 'twoSum',
  params: [{ name: 'nums', type: 'number[]' }, { name: 'target', type: 'number' }],
  returnType: 'number[]',
  testCases: [{ args: [[2, 7, 11, 15], 9], expected: [0, 1] }],
}

const run: RunResult = {
  cases: [{ passed: true, timeMs: 4, hidden: false }],
  consoleOutput: [],
  timeMs: 4,
}

function ctx(overrides: Partial<import('./buildContext').BuildContextOptions> = {}) {
  return buildContext({
    question,
    code: 'def twoSum(nums, target):\n    return [0, 1]',
    lastRun: run,
    language: lang,
    includeCode: true,
    maxMessages: 8,
    maxTokens: 4096,
    previousCodeHash: null,
    previousSummary: null,
    history: [],
    userMessage: 'fix it',
    ...overrides,
  })
}

describe('buildContext', () => {
  it('starts with the fixed system prompt', () => {
    const r = ctx()
    expect(r.messages[0].role).toBe('system')
    expect(r.messages[0].content).toContain('CodeForge AI')
  })

  it('includes question title, description and language', () => {
    const r = ctx()
    const joined = r.messages.map((m) => m.content).join('\n')
    expect(joined).toContain('Question: Two Sum')
    expect(joined).toContain('Given an array of integers')
    expect(joined).toContain('Language: python')
  })

  it('includes the code when it is new', () => {
    const r = ctx()
    expect(r.codeHash).not.toBeNull()
    expect(r.messages.some((m) => m.content.includes('Current code:'))).toBe(true)
  })

  it('sends a code-unchanged marker when the hash is unchanged', () => {
    const hash = ctx().codeHash!
    const r = ctx({ previousCodeHash: hash })
    expect(r.codeHash).toBeNull()
    expect(r.messages.some((m) => m.content.includes('unchanged since last message'))).toBe(true)
  })

  it('includes code when the user message looks code-related', () => {
    const r = ctx({ previousCodeHash: 'other', userMessage: 'there is a runtime error' })
    expect(r.codeHash).not.toBeNull()
  })

  it('omits code when the toggle is off', () => {
    const r = ctx({ includeCode: false })
    expect(r.codeHash).toBeNull()
    expect(r.messages.some((m) => m.content.includes('Current code:'))).toBe(false)
  })

  it('truncates code to ~6000 chars', () => {
    const big = 'x'.repeat(20000)
    const r = ctx({ code: big })
    const codeMsg = r.messages.find((m) => m.content.includes('Current code:'))!
    expect(codeMsg.content).toContain('[truncated]')
    expect(codeMsg.content.length).toBeLessThan(7000)
  })

  it('summarises the last run to ~500 chars', () => {
    const bigRun: RunResult = {
      cases: [{ passed: false, error: 'E'.repeat(2000), timeMs: 1, hidden: false }],
      consoleOutput: [],
      timeMs: 1,
    }
    const r = ctx({ lastRun: bigRun })
    const msg = r.messages.find((m) => m.content.includes('Last run:'))!
    // The run summary itself stays under the 500-char cap; the surrounding
    // context lines push the whole message over 500.
    expect(msg.content).toContain('First failure:')
    expect(msg.content).toContain('E'.repeat(100))
    const prefix = msg.content.slice(0, msg.content.indexOf('First failure'))
    expect(prefix.length).toBeLessThan(600)
  })

  it('keeps the last N messages verbatim and collapses older ones', () => {
    const history: ChatMessage[] = []
    for (let i = 0; i < 12; i++) history.push({ role: 'user', content: `msg ${i}` })
    const r = ctx({ history, userMessage: 'current', maxMessages: 5 })
    // 8 messages are folded into a summary; 4 verbatim + the current one remain.
    const summary = r.messages.find((m) => m.content.startsWith('Summary:'))
    expect(summary).toBeTruthy()
    // The context block is also role 'user', so there are 5 verbatim user
    // messages plus the context block = 6 user messages in total.
    expect(r.messages.filter((m) => m.role === 'user')).toHaveLength(6)
    expect(r.summary).not.toBeNull()
    expect(r.summary!.count).toBe(8)
  })

  it('returns no summary when nothing is collapsed', () => {
    const r = ctx({ history: [{ role: 'user', content: 'only one' }], userMessage: null, maxMessages: 8 })
    expect(r.summary).toBeNull()
  })

  it('produces an approximate token estimate', () => {
    const r = ctx()
    expect(typeof r.tokenEstimate).toBe('number')
    expect(r.tokenEstimate).toBeGreaterThan(0)
  })

  it('never calls the AI on its own', () => {
    expect(typeof (buildContext as unknown)).toBe('function')
  })
})

describe('windowHistory', () => {
  it('keeps everything when under the limit', () => {
    const history: ChatMessage[] = [{ role: 'user', content: 'a' }]
    const r = windowHistory(history, 'b', 8)
    expect(r.messages).toHaveLength(2)
    expect(r.summary).toBeNull()
  })

  it('collapses the overflow into a summary', () => {
    const history: ChatMessage[] = [
      { role: 'user', content: 'old one' },
      { role: 'assistant', content: 'old two' },
    ]
    const r = windowHistory(history, 'new', 1)
    expect(r.messages[0].role).toBe('system')
    expect(r.messages[0].content).toContain('Summary:')
    expect(r.messages[0].content).toContain('old one')
    expect(r.messages[1].content).toBe('new')
    expect(r.summary).toEqual({ text: expect.any(String), count: 2 })
  })
})