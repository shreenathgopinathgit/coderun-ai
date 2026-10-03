import React, { useEffect, useRef } from 'react'
import { AlertTriangle, KeyRound, RefreshCw } from 'lucide-react'
import { useAppStore } from '../../store/store'
import { useChat } from './useChat'
import { MessageList } from './MessageList'
import { ChatInput } from './ChatInput'
import { Button } from '../ui/Button'
import type { APIProfile } from '../../store/types'
import type { Language } from '../../store/types'
import type { RunResult } from '../../runner/types'
import type { Question } from '../../api/buildContext'

interface ChatPanelProps {
  profile: APIProfile | null
  language: Language
  code: string
  lastRun: RunResult | null
  question: Question | null
}

/** Friendly copy for each typed chat error code. */
function errorCopy(code: string): { title: string; hint: string } {
  switch (code) {
    case 'auth':
      return {
        title: 'The API key was rejected.',
        hint: 'Check the key in your profile, then try again.',
      }
    case 'rate_limit':
      return {
        title: 'The provider is rate-limiting this request.',
        hint: 'Wait a moment and press Retry, or switch to a less busy model.',
      }
    case 'network':
      return {
        title: 'Could not reach the provider.',
        hint: 'Check your connection and the base URL in your profile. A CORS block can also cause this.',
      }
    case 'aborted':
      return {
        title: 'Stopped.',
        hint: 'The reply was cut off. Press Send again to continue.',
      }
    default:
      return {
        title: 'Something went wrong.',
        hint: 'Try again, or check the provider status.',
      }
  }
}

/** A minimal error boundary that catches render errors in the chat tree. */
class ChatErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-error)]">
            <AlertTriangle size={22} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--color-text)]">
              The chat panel hit an error while rendering.
            </p>
            <p className="text-xs text-[var(--color-text-dim)]">
              Refresh the page to try again.
            </p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

export function ChatPanel({
  profile,
  language,
  code,
  lastRun,
  question,
}: ChatPanelProps) {
  const setApiKeyModalOpen = useAppStore((s) => s.setApiKeyModalOpen)
  const chat = useChat({ profile, language, code, lastRun, question })

  // When the active profile changes from null to a real profile (for example
  // the user activates one while the modal is open), close the modal so the
  // chat can start. This only fires on a null -> profile transition, never
  // while a profile is already active — that is what let the burger menu's
  // "API Keys" open the modal on a profile that was already active.
  const prevProfileRef = useRef<APIProfile | null>(null)
  useEffect(() => {
    if (prevProfileRef.current === null && profile) setApiKeyModalOpen(false)
    prevProfileRef.current = profile
  }, [profile, setApiKeyModalOpen])

  const errorInfo = chat.error ? errorCopy(chat.error.code) : null

  return (
    <ChatErrorBoundary>
      <div className="flex h-full min-h-0 flex-col">
        {!profile ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-dim)]">
              <KeyRound size={26} />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-[var(--color-text)]">
                Add an API key to chat
              </p>
              <p className="text-xs text-[var(--color-text-dim)]">
                The Ask tab needs an active profile. Keys are stored only in
                this browser and are sent only to the provider you configure.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setApiKeyModalOpen(true)}>
              Add an API key
            </Button>
          </div>
        ) : (
          <>
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <MessageList messages={chat.messages} streaming={null} />
            </div>

            {errorInfo && (
              <div className="mx-2 mb-2 flex items-start gap-2 rounded-md border border-[var(--color-error)]/40 bg-[var(--color-error)]/10 px-3 py-2 text-xs">
                <AlertTriangle
                  size={14}
                  className="mt-0.5 shrink-0 text-[var(--color-error)]"
                />
                <div className="flex-1 space-y-0.5">
                  <p className="font-medium text-[var(--color-text)]">{errorInfo.title}</p>
                  <p className="text-[var(--color-text-dim)]">{errorInfo.hint}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={chat.retry}
                  className="shrink-0"
                >
                  <RefreshCw size={12} /> Retry
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between border-t border-[var(--color-border)] px-3 py-1.5 text-[11px] text-[var(--color-text-dim)]">
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={chat.includeContext}
                  onChange={(e) => chat.setIncludeContext(e.target.checked)}
                  className="accent-[var(--color-accent)]"
                />
                Include my code
              </label>
              <span>
                Last request: {chat.lastRequestTokens ?? 0} tokens · Session:{' '}
                {chat.sessionTokens} tokens
              </span>
            </div>

            <ChatInput
              onSend={chat.send}
              onStop={chat.stop}
              onClear={chat.clear}
              sending={chat.sending}
              disabled={false}
            />
          </>
        )}
      </div>
    </ChatErrorBoundary>
  )
}