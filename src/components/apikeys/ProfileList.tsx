import { Check, Pencil, Trash2 } from 'lucide-react'
import type { APIProfile } from '../../store/types'
import { Button } from '../ui/Button'

interface ProfileListProps {
  profiles: APIProfile[]
  activeId: string | null
  editingId: string | null
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onActivate: (id: string) => void
}

/**
 * Saved profiles with Edit, Delete and an Active control. Exactly one
 * profile can be active; switching takes effect immediately.
 */
export function ProfileList({
  profiles,
  activeId,
  editingId,
  onEdit,
  onDelete,
  onActivate,
}: ProfileListProps) {
  if (profiles.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-[var(--color-text-dim)]">
        No profiles yet. Add one to start using the AI tutor.
      </p>
    )
  }

  return (
    <ul className="flex flex-col gap-2">
      {profiles.map((p) => {
        const isActive = p.id === activeId
        const isEditing = p.id === editingId
        return (
          <li
            key={p.id}
            className={`flex items-center gap-2 rounded border px-3 py-2 ${
              isActive
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                : 'border-[var(--color-border)] bg-[var(--color-bg-elevated)]'
            }`}
          >
            <button
              type="button"
              onClick={() => onActivate(p.id)}
              className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-current"
              aria-label={`Set ${p.name} as active profile`}
            >
              {isActive && <Check size={10} className="text-[var(--color-accent)]" />}
            </button>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-[var(--color-text)]">
                {p.name}
              </div>
              <div className="truncate text-xs text-[var(--color-text-dim)]">
                {p.model} · {p.provider}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(p.id)}
              disabled={isEditing}
            >
              <Pencil size={13} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(p.id)}
            >
              <Trash2 size={13} />
            </Button>
          </li>
        )
      })}
    </ul>
  )
}