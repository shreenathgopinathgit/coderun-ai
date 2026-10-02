import { ChevronDown, Play, Square, RotateCcw, Package } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Language } from '../../store/types'

export interface ToolbarProps {
  language: Language
  onLanguageChange: (language: Language) => void
  onRun: () => void
  onSubmit: () => void
  onReset: () => void
  onAddLibrary: () => void
}

const languages: { value: Language; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
]

export function Toolbar({
  language,
  onLanguageChange,
  onRun,
  onSubmit,
  onReset,
  onAddLibrary,
}: ToolbarProps) {
  return (
    <div className="flex h-10 items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3">
      <div className="relative">
        <select
          value={language}
          onChange={(e) => onLanguageChange(e.target.value as Language)}
          className="appearance-none rounded border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 pr-7 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        >
          {languages.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-text-dim)]"
        />
      </div>

      <Button
        variant="primary"
        size="sm"
        onClick={onRun}
        disabled
        title="Available after the code runner is built"
      >
        <Play size={14} />
        Run
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onSubmit}
        disabled
        title="Available after the test runner is built"
      >
        <Square size={14} />
        Submit
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onReset}
        title={`Restore the empty ${languages.find((l) => l.value === language)?.label} starter`}
      >
        <RotateCcw size={14} />
        Reset code
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onAddLibrary}
        disabled
        title="Available after the library loader is built"
      >
        <Package size={14} />
        Add library
      </Button>
    </div>
  )
}