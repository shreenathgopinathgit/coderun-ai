import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '../ui/Button'
import type { ProfileDraft } from './ProfileForm'
import { fetchModels, testConnection, type ModelEntry } from '../../api/models'
import { normalizeBaseUrl } from '../../store/providerPresets'

interface ModelPickerProps {
  draft: ProfileDraft
  onModelChange: (model: string) => void
}

/**
 * One searchable model field: a text input with a filtered dropdown of the
 * fetched models. Typing a custom id is always allowed — the typed or
 * selected value is what the profile sends.
 */
export function ModelPicker({ draft, onModelChange }: ModelPickerProps) {
  const [models, setModels] = useState<ModelEntry[]>([])
  const [open, setOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [connError, setConnError] = useState<string | null>(null)
  const [connOk, setConnOk] = useState(false)

  const usable = models.filter((m) => m.usableForChat)
  const query = draft.model.trim().toLowerCase()
  const filtered = query
    ? usable.filter((m) => m.id.toLowerCase().includes(query))
    : usable

  const toProfile = () => ({
    id: '',
    name: draft.name,
    provider: draft.provider,
    baseUrl: draft.baseUrl,
    apiKey: draft.apiKey,
    model: draft.model,
    active: false,
  })

  const onFetch = async () => {
    if (!draft.apiKey) {
      setConnError('Set an API key first.')
      return
    }
    const urlCheck = normalizeBaseUrl(draft.baseUrl)
    if (!urlCheck.ok) {
      setConnError(urlCheck.error)
      return
    }
    setLoading(true)
    setConnError(null)
    setConnOk(false)
    setNotice(null)
    try {
      const list = await fetchModels(toProfile())
      setModels(list)
      const inList = list.some((m) => m.id === draft.model && m.usableForChat)
      if (!inList) {
        const firstUsable = list.find((m) => m.usableForChat)
        if (firstUsable) {
          onModelChange(firstUsable.id)
          setNotice(
            list.some((m) => m.id === draft.model)
              ? `"${draft.model}" is not usable for chat. Selected "${firstUsable.id}" instead.`
              : `Selected "${firstUsable.id}" from the fetched models.`,
          )
        } else {
          setNotice('No chat-capable models were returned. Type a model id manually.')
        }
      }
    } catch (e) {
      setConnError(e instanceof Error ? e.message : 'Could not fetch models.')
    } finally {
      setLoading(false)
    }
  }

  const onTest = async () => {
    if (!draft.model) {
      setConnError('Enter a model name first.')
      return
    }
    const urlCheck = normalizeBaseUrl(draft.baseUrl)
    if (!urlCheck.ok) {
      setConnError(urlCheck.error)
      return
    }
    setLoading(true)
    setConnError(null)
    setConnOk(false)
    try {
      const result = await testConnection(toProfile())
      setConnOk(result.ok)
      if (!result.ok) setConnError(result.error)
    } catch (e) {
      setConnError(e instanceof Error ? e.message : 'Connection test failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          loading={loading}
          onClick={onFetch}
          disabled={!draft.apiKey}
        >
          Fetch models
        </Button>
        <Button variant="secondary" size="sm" loading={loading} onClick={onTest}>
          Test connection
        </Button>
      </div>

      <div className="relative">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--color-text-dim)]">
            Model name
          </span>
          <div className="relative">
            <input
              id="model-name"
              data-testid="model-name-input"
              type="text"
              value={draft.model}
              onChange={(e) => {
                onModelChange(e.target.value)
                setOpen(true)
              }}
              onFocus={() => usable.length > 0 && setOpen(true)}
              placeholder="Type a model id or pick from the list"
              className="input pr-8"
              autoComplete="off"
            />
            <button
              type="button"
              aria-label="Toggle model list"
              onClick={() => setOpen((o) => !o)}
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </label>

        {open && filtered.length > 0 && (
          <div
            role="listbox"
            className="absolute z-20 mt-1 max-h-52 w-full overflow-auto rounded-md border border-[var(--color-border)] bg-[var(--color-bg)] shadow-lg"
            onMouseDown={(e) => e.preventDefault()}
          >
            {filtered.map((m) => (
              <button
                key={m.id}
                type="button"
                role="option"
                aria-selected={draft.model === m.id}
                onClick={() => {
                  onModelChange(m.id)
                  setOpen(false)
                }}
                className={`flex w-full flex-col items-start px-3 py-1.5 text-left hover:bg-[var(--color-bg-hover)] ${
                  draft.model === m.id ? 'bg-[var(--color-bg-hover)]' : ''
                }`}
              >
                <span className="text-xs font-medium text-[var(--color-text)]">
                  {m.id}
                </span>
                {m.description && (
                  <span className="text-[10px] text-[var(--color-text-dim)]">
                    {m.description}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {models.length > 0 && (
        <p className="text-[11px] text-[var(--color-text-dim)]">
          {models.length} model{models.length === 1 ? '' : 's'} fetched
          {usable.length < models.length ? ` (${usable.length} usable for chat)` : ''}
        </p>
      )}
      {notice && <p className="text-[11px] text-[var(--color-accent)]">{notice}</p>}
      {connError && (
        <p role="alert" className="text-xs text-[var(--color-error)]">
          {connError}
        </p>
      )}
      {connOk && !connError && (
        <p role="status" className="text-xs text-[var(--color-success)]">
          Connection OK.
        </p>
      )}
    </div>
  )
}