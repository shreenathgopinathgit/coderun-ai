import { useState } from 'react'
import { Button } from '../ui/Button'
import type { ProfileDraft } from './ProfileForm'
import { fetchModels, testConnection } from '../../api/models'

interface ModelPickerProps {
  draft: ProfileDraft
  onModelChange: (model: string) => void
}

/**
 * Fetch models, pick one (or type it manually), and test the connection.
 * Uses the client functions from src/api/models.ts directly.
 */
export function ModelPicker({ draft, onModelChange }: ModelPickerProps) {
  const [models, setModels] = useState<string[]>([])
  const [manual, setManual] = useState(false)
  const [loading, setLoading] = useState(false)
  const [connError, setConnError] = useState<string | null>(null)
  const [connOk, setConnOk] = useState(false)

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
    if (!draft.baseUrl || !draft.apiKey) {
      setConnError('Set a base URL and API key first.')
      return
    }
    setLoading(true)
    setConnError(null)
    setConnOk(false)
    try {
      const list = await fetchModels(toProfile())
      setModels(list.map((m) => m.id))
      setManual(false)
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
          disabled={!draft.baseUrl || !draft.apiKey}
        >
          Fetch models
        </Button>
        <Button variant="secondary" size="sm" loading={loading} onClick={onTest}>
          Test connection
        </Button>
      </div>

      {models.length > 0 && !manual ? (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--color-text-dim)]">
            Model
          </span>
          <select
            value={draft.model}
            onChange={(e) => onModelChange(e.target.value)}
            className="input"
          >
            {models.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="self-start text-xs text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
            onClick={() => {
              setManual(true)
              setModels([])
            }}
          >
            Type manually instead
          </button>
        </label>
      ) : (
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-[var(--color-text-dim)]">
            Model name
          </span>
          <input
            type="text"
            value={draft.model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder="llama-3.3-70b-versatile"
            className="input"
          />
        </label>
      )}

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