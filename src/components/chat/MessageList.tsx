import { useEffect, useRef, useState } from 'react'
import { User, Bot } from 'lucide-react'
import { Markdown } from './Markdown'
import type { ChatMessage } from '../../store/types'

interface MessageListProps {
  messages: ChatMessage[]
  streaming?: string | null
}

/**
 * Scrollable message list. Auto-scrolls to the bottom while the user has not
 * scrolled up; once they do, scrolling stops until a new message arrives or
 * they scroll back to the bottom.
 */
export function MessageList({ messages, streaming }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [following, setFollowing] = useState(true)
  const prevCount = useRef(messages.length)
  const prevStreaming = useRef(streaming ?? null)

  // Keep following when a new message is appended or streaming grows.
  useEffect(() => {
    const grew =
      messages.length !== prevCount.current ||
      (streaming ?? null) !== prevStreaming.current
    prevCount.current = messages.length
    prevStreaming.current = streaming ?? null
    if (grew && following) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'auto' })
    }
  }, [messages, streaming, following])

  const onScroll = () => {
    const el = scrollRef.current
    if (!el) return
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    setFollowing(nearBottom)
  }

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="flex-1 min-h-0 overflow-y-auto px-4 py-3"
    >
      {messages.length === 0 && !streaming ? (
        <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-dim)]">
            <Bot size={22} />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-[var(--color-text)]">No messages yet</p>
            <p className="text-xs text-[var(--color-text-dim)]">
              Ask a question, ask for help debugging, or request a practice question.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <div key={m.id} className="flex gap-2">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-dim)]">
                {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className="min-w-0 flex-1 text-sm text-[var(--color-text)] [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-[var(--color-border)] [&_pre]:bg-[var(--color-bg)] [&_pre]:p-3 [&_pre]:text-sm [&_code]:font-mono">
                <Markdown content={m.content} />
              </div>
            </div>
          ))}
          {streaming && (
            <div className="flex gap-2">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-dim)]">
                <Bot size={14} />
              </div>
              <div className="min-w-0 flex-1 text-sm text-[var(--color-text)] [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-[var(--color-border)] [&_pre]:bg-[var(--color-bg)] [&_pre]:p-3 [&_pre]:text-sm [&_code]:font-mono">
                <Markdown content={streaming} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}