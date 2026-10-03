import { useCallback, useRef, useState } from 'react'
import { useAppStore } from '../../store/store'
import type { APIProfile } from '../../store/types'
import type { Language } from '../../store/types'
import type { RunResult } from '../../runner/types'
import { buildContext } from '../../api/buildContext'
import { sendChatStream } from '../../api/chatClient'
import { isChatError } from '../../api/errors'
import type { Question } from '../../api/buildContext'

export interface UseChatOptions {
  /** The active profile, or null when no key is configured. */
  profile: APIProfile | null
  /** Current editor language. */
  language: Language
  /** Current editor code. */
  code: string
  /** Last run result, if any. */
  lastRun: RunResult | null
  /** Current question, or null when only scratch code is loaded. */
  question: Question | null
}

/**
 * Hook that sends a message through `buildContext()` and `sendChatStream()`
 * to the ACTIVE profile only. It never calls the AI from Run or Submit —
 * those go through the runner.
 */
export function useChat({ profile, language, code, lastRun, question }: UseChatOptions) {
  const messages = useAppStore((s) => s.chat.messages)
  const includeContext = useAppStore((s) => s.chat.includeContext)
  const lastRequestTokens = useAppStore((s) => s.chat.lastRequestTokens)
  const sessionTokens = useAppStore((s) => s.chat.sessionTokens)
  const appendChatMessage = useAppStore((s) => s.appendChatMessage)
  const setChatMessages = useAppStore((s) => s.setChatMessages)
  const setIncludeContext = useAppStore((s) => s.setIncludeContext)
  const setChatTokenEstimate = useAppStore((s) => s.setChatTokenEstimate)
  const clearChat = useAppStore((s) => s.clearChat)

  const [sending, setSending] = useState(false)
  const [error, setError] = useState<{ code: string; message: string } | null>(null)
  const [lastText, setLastText] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const sendingRef = useRef(false)

  const send = useCallback(
    async (text: string): Promise<void> => {
      if (!profile || sendingRef.current || !text.trim()) return
      sendingRef.current = true
      setSending(true)
      setError(null)
      setLastText(text)
      const controller = new AbortController()
      abortRef.current = controller

      appendChatMessage({ id: crypto.randomUUID(), role: 'user', content: text.trim() })

      // Snapshot the conversation once. Every streaming update rebuilds the
      // list from this base plus the growing assistant reply, so the reply is
      // never duplicated and a stale store read never drops the user message.
      const baseMessages = useAppStore.getState().chat.messages

      let assistantId = ''
      try {
        const built = buildContext({
          question: question ?? null,
          code,
          lastRun,
          language,
          includeCode: includeContext,
          maxMessages: 10,
          maxTokens: 4096,
          previousCodeHash: null,
          previousSummary: null,
          history: baseMessages.map((m) => ({ role: m.role, content: m.content })),
          userMessage: text.trim(),
        })
        setChatTokenEstimate(built.tokenEstimate)

        let acc = ''
        assistantId = crypto.randomUUID()
        await sendChatStream(
          profile,
          built.messages,
          {
            signal: controller.signal,
            onToken: (token) => {
              acc += token
              setChatMessages([
                ...baseMessages,
                { id: assistantId, role: 'assistant', content: acc },
              ])
            },
            maxTokens: 4096,
          },
        )
        // Final flush in case the last token batch did not update state.
        setChatMessages([
          ...baseMessages,
          { id: assistantId, role: 'assistant', content: acc },
        ])
      } catch (e) {
        if (isChatError(e) && e.code === 'aborted') {
          // User pressed Stop; leave the partial reply in the list.
          return
        }
        if (isChatError(e)) {
          setError({ code: e.code, message: e.message })
        } else {
          setError({ code: 'server', message: e instanceof Error ? e.message : 'Request failed.' })
        }
      } finally {
        sendingRef.current = false
        setSending(false)
        abortRef.current = null
      }
    },
    [
      profile,
      includeContext,
      appendChatMessage,
      setChatMessages,
      setChatTokenEstimate,
      code,
      language,
      lastRun,
      question,
    ],
  )

  const stop = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  const retry = useCallback(() => {
    if (lastText) send(lastText)
  }, [lastText, send])

  const clear = useCallback(() => {
    clearChat()
    setError(null)
    setLastText('')
  }, [clearChat])

  return {
    messages,
    sending,
    error,
    lastRequestTokens,
    sessionTokens,
    includeContext,
    setIncludeContext,
    send,
    stop,
    retry,
    clear,
  }
}