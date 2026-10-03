import { useState } from 'react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import type { CaseResult, RunResult } from '../../runner/types'

export interface OutputPanelProps {
  result: RunResult | null
  error: string | null
  timedOut: boolean
  pyLoading: boolean
  pyError: string | null
  onClear: () => void
}

type Tab = 'console' | 'results'

const EMPTY: Record<Tab, string> = {
  console:
    'No console output yet. Run your code to see stdout, stderr and runtime errors here.',
  results:
    'No test results yet. Run or submit to see pass/fail for each test case.',
}

const TABS: { value: Tab; label: string }[] = [
  { value: 'console', label: 'Console' },
  { value: 'results', label: 'Test Results' },
]

function TabBar({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <div className="flex h-10 items-center border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
      {TABS.map((t) => (
        <button
          key={t.value}
          type="button"
          className={`flex-1 text-sm font-medium ${
            tab === t.value
              ? 'text-[var(--color-text)] border-b-2 border-[var(--color-accent)]'
              : 'text-[var(--color-text-dim)]'
          }`}
          onClick={() => setTab(t.value)}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function ConsoleTab({ result, error, timedOut, pyLoading, pyError }: {
  result: RunResult | null
  error: string | null
  timedOut: boolean
  pyLoading: boolean
  pyError: string | null
}) {
  if (pyLoading) {
    return <p className="text-xs font-mono text-[var(--color-text-dim)]">Loading Python runtime…</p>
  }
  if (pyError) {
    return <p className="text-xs font-mono text-[var(--color-error)]">{pyError}</p>
  }
  if (timedOut) {
    return <p className="text-xs font-mono text-[var(--color-warning)]">Time Limit Exceeded</p>
  }
  if (error) {
    return <pre className="text-xs font-mono whitespace-pre-wrap text-[var(--color-error)]">{error}</pre>
  }
  const lines = result?.consoleOutput ?? []
  return lines.length ? (
    <pre className="text-xs font-mono whitespace-pre-wrap text-[var(--color-text-dim)]">
      {lines.join('\n')}
    </pre>
  ) : (
    <p className="text-xs font-mono text-[var(--color-text-dim)]">{EMPTY.console}</p>
  )
}

function ResultsTab({ result }: { result: RunResult | null }) {
  if (!result || result.cases.length === 0) {
    return <p className="text-xs font-mono text-[var(--color-text-dim)]">{EMPTY.results}</p>
  }
  return (
    <div className="space-y-2 text-xs font-mono">
      <div className="flex justify-between text-[var(--color-text-dim)]">
        <span>{result.cases.length} case(s)</span>
        <span>{result.cases.filter((c) => c.passed).length} passed</span>
        <span>{result.timeMs} ms</span>
      </div>
      {result.cases.map((c: CaseResult, i: number) => (
        <div
          key={i}
          className={`rounded border px-2 py-1 ${
            c.passed
              ? 'border-[var(--color-success)]/40 text-[var(--color-success)]'
              : 'border-[var(--color-error)]/40 text-[var(--color-error)]'
          }`}
        >
          <span className="font-semibold">{c.passed ? '✓' : '✗'}</span>
          {' case '}
          {i + 1}
          {c.error ? `: ${c.error}` : ''}
          {!c.passed && c.actual !== undefined && (
            <span className="ml-2">
              actual: {JSON.stringify(c.actual)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export function OutputPanel({
  result,
  error,
  timedOut,
  pyLoading,
  pyError,
  onClear,
}: OutputPanelProps) {
  const [popoutOpen, setPopoutOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('console')

  return (
    <>
      <div className="flex h-full flex-col border-t border-[var(--color-border)]">
        <TabBar tab={tab} setTab={setTab} />
        <div className="flex-1 overflow-auto p-4">
          {tab === 'console' ? (
            <ConsoleTab
              result={result}
              error={error}
              timedOut={timedOut}
              pyLoading={pyLoading}
              pyError={pyError}
            />
          ) : (
            <ResultsTab result={result} />
          )}
        </div>
        <div className="flex h-10 items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4">
          <Button variant="ghost" size="sm" onClick={onClear}>
            Clear
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setPopoutOpen(true)}>
            Pop-out
          </Button>
        </div>
      </div>

      <Modal
        open={popoutOpen}
        onClose={() => setPopoutOpen(false)}
        title="Output"
        width="800px"
      >
        <div className="flex h-[70vh] flex-col">
          <TabBar tab={tab} setTab={setTab} />
          <div className="flex-1 overflow-auto p-4">
            {tab === 'console' ? (
              <ConsoleTab
                result={result}
                error={error}
                timedOut={timedOut}
                pyLoading={pyLoading}
                pyError={pyError}
              />
            ) : (
              <ResultsTab result={result} />
            )}
          </div>
          <div className="flex h-10 items-center justify-end border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-4">
            <Button variant="ghost" size="sm" onClick={onClear}>
              Clear
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}