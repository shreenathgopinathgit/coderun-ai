import { ChevronDown, Play, Square, RotateCcw, Package, Square as StopIcon } from 'lucide-react'
import { Button } from '../ui/Button'
import type { Language } from '../../store/types'

export interface ToolbarProps {
  language: Language
  onLanguageChange: (language: Language) => void
  onRun: () => void
  onRunStop: () => void
  onSubmit: () => void
  onReset: () => void
  onAddLibrary: () => void
  disabled: boolean
  stopDisabled: boolean
  stopTitle?: string
  submitDisabled: boolean
  submitTitle: string
}

const languages: { value: Language; label: string }[] = [
  { value: 'python', label: 'Python' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'java', label: 'Java' },
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
]

export function Toolbar({
  language,
  onLanguageChange,
  onRun,
  onRunStop,
  onSubmit,
  onReset,
  onAddLibrary,
  disabled,
  stopDisabled,
  stopTitle,
  submitDisabled,
  submitTitle,
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

      <Button variant="primary" size="sm" onClick={onRun} disabled={disabled}>
        <Play size={14} />
        Run
      </Button>

      <Button
        variant="danger"
        size="sm"
        onClick={onRunStop}
        disabled={stopDisabled}
        title={stopTitle}
      >
        <StopIcon size={14} />
        Stop
      </Button>

      <Button
        variant="secondary"
        size="sm"
        onClick={onSubmit}
        disabled={submitDisabled}
        title={submitTitle}
      >
        <Square size={14} />
        Submit
      </Button>

      <Button variant="secondary" size="sm" onClick={onReset}>
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