import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore, mergePersisted } from './store'
import type { ChatMessage } from './types'

function msg(overrides: Partial<ChatMessage> = {}): ChatMessage {
  return {
    id: `m${Math.random().toString(36).slice(2)}`,
    role: 'user',
    content: 'hello',
    ...overrides,
  }
}

describe('chat session state', () => {
  beforeEach(() => {
    useAppStore.getState().clearChat()
    useAppStore.getState().setProfiles([])
    useAppStore.getState().setActiveProfile(null)
  })

  it('starts with an empty session and context on', () => {
    const s = useAppStore.getState()
    expect(s.chat.messages).toEqual([])
    expect(s.chat.includeContext).toBe(true)
    expect(s.chat.lastRequestTokens).toBeNull()
    expect(s.chat.sessionTokens).toBe(0)
  })

  it('appends messages and keeps them in order', () => {
    useAppStore.getState().appendChatMessage(msg({ id: 'a', role: 'user', content: 'hi' }))
    useAppStore.getState().appendChatMessage(msg({ id: 'b', role: 'assistant', content: 'hello' }))
    const s = useAppStore.getState()
    expect(s.chat.messages.map((m) => m.id)).toEqual(['a', 'b'])
  })

  it('trims history to the size cap', () => {
    const many = Array.from({ length: 40 }, (_, i) =>
      msg({ id: `m${i}`, content: `message ${i}` }),
    )
    useAppStore.getState().setChatMessages(many)
    expect(useAppStore.getState().chat.messages).toHaveLength(24)
    // The newest messages survive the trim.
    expect(useAppStore.getState().chat.messages[0].id).toBe('m16')
    expect(useAppStore.getState().chat.messages[23].id).toBe('m39')
  })

  it('clearChat empties the session and resets token estimates', () => {
    useAppStore.getState().appendChatMessage(msg({ id: 'a' }))
    useAppStore.getState().setChatTokenEstimate(123)
    useAppStore.getState().clearChat()
    const s = useAppStore.getState()
    expect(s.chat.messages).toEqual([])
    expect(s.chat.lastRequestTokens).toBeNull()
    expect(s.chat.sessionTokens).toBe(0)
  })

  it('setIncludeContext toggles the flag', () => {
    useAppStore.getState().setIncludeContext(false)
    expect(useAppStore.getState().chat.includeContext).toBe(false)
    useAppStore.getState().setIncludeContext(true)
    expect(useAppStore.getState().chat.includeContext).toBe(true)
  })

  it('setChatTokenEstimate accumulates the session total', () => {
    useAppStore.getState().setChatTokenEstimate(100)
    useAppStore.getState().setChatTokenEstimate(50)
    const s = useAppStore.getState()
    expect(s.chat.lastRequestTokens).toBe(50)
    expect(s.chat.sessionTokens).toBe(150)
  })

  it('persists chat messages and includeContext to localStorage', () => {
    useAppStore.getState().appendChatMessage(msg({ id: 'a', content: 'persist me' }))
    useAppStore.getState().setIncludeContext(false)
    const raw = localStorage.getItem('codeforge-ai:state')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.chat.messages).toHaveLength(1)
    expect(parsed.state.chat.messages[0].content).toBe('persist me')
    expect(parsed.state.chat.includeContext).toBe(false)
  })

  it('mergePersisted normalises a stale chat record', () => {
    const raw = JSON.stringify({
      state: {
        profiles: [],
        activeProfileId: null,
        practice: { lastLanguage: 'python', paneSizes: { left: 42, right: 58 } },
        chat: {
          messages: [{ id: 'x', role: 'assistant', content: 'ok' }],
          includeContext: 'not-a-boolean',
          lastRequestTokens: 'bad',
          sessionTokens: 'bad',
        },
      },
    })
    localStorage.setItem('codeforge-ai:state', raw)
    // Re-create the store by importing it fresh is not possible; instead
    // exercise the merge path through the persisted state directly.
    const merged = mergePersisted(
      {
        profiles: [],
        activeProfileId: null,
        practice: {
          lastLanguage: 'python',
          paneSizes: { left: 42, right: 58 },
          editorHeight: { editor: 55, output: 45 },
          codeByQuestion: {},
        },
        chat: {
          messages: [{ id: 'x', role: 'assistant', content: 'ok' }],
          includeContext: 'not-a-boolean',
          lastRequestTokens: 'bad',
          sessionTokens: 'bad',
        },
        lastRun: { result: null },
      } as never,
      useAppStore.getState(),
    )
    expect(merged.chat?.messages).toHaveLength(1)
    expect(merged.chat?.messages[0].role).toBe('assistant')
    expect(merged.chat?.includeContext).toBe(true)
    expect(merged.chat?.lastRequestTokens).toBeNull()
    expect(merged.chat?.sessionTokens).toBe(0)
  })

  it('mergePersisted drops malformed message entries', () => {
    const merged = mergePersisted(
      {
        profiles: [],
        activeProfileId: null,
        practice: {
          lastLanguage: 'python',
          paneSizes: { left: 42, right: 58 },
          editorHeight: { editor: 55, output: 45 },
          codeByQuestion: {},
        },
        chat: {
          messages: [
            { role: 'user', content: 'no id' },
            { id: 123, content: 'non-string id' },
            { id: 'good', role: 'assistant', content: 'kept' },
          ],
          includeContext: true,
          lastRequestTokens: null,
          sessionTokens: 0,
        },
        lastRun: { result: null },
      } as never,
      useAppStore.getState(),
    )
    expect(merged.chat?.messages).toHaveLength(1)
    expect(merged.chat?.messages[0].content).toBe('kept')
  })
})