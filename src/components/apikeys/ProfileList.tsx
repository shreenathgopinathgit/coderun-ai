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
            {isActive ? (
              <span className="flex h-4 shrink-0 items-center gap-1 rounded-full border border-[var(--color-accent)] bg-[var(--color-accent)] px-1.5 text-[10px] font-semibold text-white">
                <Check size={9} /> Active
              </span>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onActivate(p.id)}
                aria-label={`Set ${p.name} as active profile`}
                className="h-4 shrink-0 px-1.5 text-[11px]"
              >
                Set active
              </Button>
            )}
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