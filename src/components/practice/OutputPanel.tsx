import { useState } from 'react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'

export interface OutputPanelProps {
  consoleOutput: string
  testResults: string
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

function TabPanel({ tab, consoleOutput, testResults }: { tab: Tab; consoleOutput: string; testResults: string }) {
  const content = tab === 'console' ? consoleOutput : testResults
  return (
    <pre className="h-full text-xs font-mono whitespace-pre-wrap break-words text-[var(--color-text-dim)]">
      {content || EMPTY[tab]}
    </pre>
  )
}

export function OutputPanel({ consoleOutput, testResults, onClear }: OutputPanelProps) {
  const [popoutOpen, setPopoutOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('console')

  return (
    <>
      <div className="flex h-full flex-col border-t border-[var(--color-border)]">
        <TabBar tab={tab} setTab={setTab} />
        <div className="flex-1 overflow-auto p-4">
          <TabPanel tab={tab} consoleOutput={consoleOutput} testResults={testResults} />
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
            <TabPanel tab={tab} consoleOutput={consoleOutput} testResults={testResults} />
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