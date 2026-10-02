import { useState } from 'react'
import { MessageSquare, FileQuestion, HelpCircle } from 'lucide-react'

type Tab = 'ask' | 'question'

const TABS: { value: Tab; label: string; icon: typeof MessageSquare }[] = [
  { value: 'ask', label: 'Ask', icon: MessageSquare },
  { value: 'question', label: 'Question', icon: FileQuestion },
]

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof MessageSquare
  title: string
  description: string
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] text-[var(--color-text-dim)]">
        <Icon size={22} />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-medium text-[var(--color-text)]">{title}</p>
        <p className="text-xs text-[var(--color-text-dim)]">{description}</p>
      </div>
    </div>
  )
}

export function LeftPane() {
  const [tab, setTab] = useState<Tab>('ask')

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 items-center border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
        {TABS.map((t) => (
          <button
            key={t.value}
            type="button"
            className={`flex h-full flex-1 items-center justify-center gap-1.5 border-b-2 text-sm font-medium ${
              tab === t.value
                ? 'border-[var(--color-accent)] text-[var(--color-text)]'
                : 'border-transparent text-[var(--color-text-dim)]'
            }`}
            onClick={() => setTab(t.value)}
          >
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {tab === 'ask' ? (
          <EmptyState
            icon={HelpCircle}
            title="Chat arrives in a later phase"
            description="Add an API key first. Then ask questions, debug code, and generate practice questions — all coming soon."
          />
        ) : (
          <EmptyState
            icon={FileQuestion}
            title="No questions yet"
            description="Ask the AI for practice questions and they will appear here, one at a time."
          />
        )}
      </div>
    </div>
  )
}