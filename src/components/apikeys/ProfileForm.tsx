import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import type { ProviderPreset } from '../../store/types'
import { getPreset, PROVIDER_PRESETS } from '../../store/providerPresets'

export interface ProfileDraft {
  name: string
  provider: ProviderPreset
  baseUrl: string
  apiKey: string
  model: string
}

interface ProfileFormProps {
  draft: ProfileDraft
  onChange: (draft: ProfileDraft) => void
}

/**
 * The fields of one API profile. No buttons, no fetching — the parent owns
 * save/cancel and the model/connection actions.
 */
export function ProfileForm({ draft, onChange }: ProfileFormProps) {
  const [showKey, setShowKey] = useState(false)

  const set = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) =>
    onChange({ ...draft, [key]: value })

  const onProviderChange = (provider: ProviderPreset) => {
    const preset = getPreset(provider)
    set('provider', provider)
    if (provider !== 'custom') {
      set('baseUrl', preset.baseUrl)
      if (!draft.model) set('model', preset.defaultModel)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--color-text-dim)]">
          Profile name
        </span>
        <input
          id="profile-name"
          type="text"
          value={draft.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="Groq (free)"
          className="input"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--color-text-dim)]">
          Provider
        </span>
        <select
          id="provider"
          value={draft.provider}
          onChange={(e) => onProviderChange(e.target.value as ProviderPreset)}
          className="input"
        >
          {PROVIDER_PRESETS.map((p) => (
            <option key={p.id} value={p.id}>
              {p.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--color-text-dim)]">
          Base URL
        </span>
        <input
          id="base-url"
          type="text"
          value={draft.baseUrl}
          onChange={(e) => set('baseUrl', e.target.value)}
          placeholder="https://api.groq.com/openai/v1"
          className="input"
        />
        <span className="text-xs text-[var(--color-text-dim)]">
          {getPreset(draft.provider).hint}
        </span>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--color-text-dim)]">
          API key
        </span>
        <div className="relative">
          <input
            id="api-key"
            data-testid="api-key-input"
            type={showKey ? 'text' : 'password'}
            value={draft.apiKey}
            onChange={(e) => set('apiKey', e.target.value)}
            placeholder="sk-..."
            className="input pr-9"
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setShowKey((s) => !s)}
            aria-label={showKey ? 'Hide key' : 'Show key'}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 text-[var(--color-text-dim)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text)]"
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-[var(--color-text-dim)]">
          Model name
        </span>
        <input
          id="model-name"
          data-testid="model-name-input"
          type="text"
          value={draft.model}
          onChange={(e) => set('model', e.target.value)}
          placeholder="llama-3.3-70b-versatile"
          className="input"
        />
      </label>
    </div>
  )
}