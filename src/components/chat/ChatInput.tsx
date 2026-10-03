import React, { useRef, useState } from 'react'
import { Send, Square, RotateCcw } from 'lucide-react'
import { Button } from '../ui/Button'

interface ChatInputProps {
  onSend: (text: string) => void
  onStop: () => void
  onClear: () => void
  sending: boolean
  disabled: boolean
  placeholder?: string
}

/**
 * Input fixed at the bottom of the chat. Enter sends, Shift+Enter inserts a
 * new line, the Stop button aborts a streaming reply, and Clear chat wipes
 * the conversation.
 */
export function ChatInput({
  onSend,
  onStop,
  onClear,
  sending,
  disabled,
  placeholder = 'Ask a question or request help...',
}: ChatInputProps) {
  const [value, setValue] = useState('')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const submit = () => {
    const text = value.trim()
    if (!text || sending || disabled) return
    onSend(text)
    setValue('')
    // Reset height after sending.
    if (taRef.current) taRef.current.style.height = 'auto'
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  const onInput = () => {
    const el = taRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }

  return (
    <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-2">
      <div className="flex items-end gap-2">
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onInput={onInput}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          className="flex-1 resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
        />
        {sending ? (
          <Button
            variant="secondary"
            size="md"
            onClick={onStop}
            className="shrink-0"
          >
            <Square size={14} /> Stop
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="shrink-0"
          >
            <Send size={14} /> Send
          </Button>
        )}
        <Button
          variant="ghost"
          size="md"
          onClick={onClear}
          disabled={disabled}
          className="shrink-0"
          title="Clear chat"
        >
          <RotateCcw size={14} />
        </Button>
      </div>
      <p className="mt-1.5 px-1 text-[11px] text-[var(--color-text-dim)]">
        Enter to send, Shift+Enter for a new line.
      </p>
    </div>
  )
}