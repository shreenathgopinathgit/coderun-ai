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
  /** Called when a preset change should clear the fetched model list and test result. */
  onPresetChange?: () => void
}

/**
 * The fields of one API profile. No buttons, no fetching — the parent owns
 * save/cancel and the model/connection actions.
 */
export function ProfileForm({ draft, onChange, onPresetChange }: ProfileFormProps) {
  const [showKey, setShowKey] = useState(false)
  // Tracks whether the user has typed into the profile name. When a preset
  // changes, the name is only filled from the preset's default if it is empty
  // or still carries the previous preset's default name.
  const [nameEdited, setNameEdited] = useState(false)
  const [lastPresetName, setLastPresetName] = useState<string | null>(null)

  const onProviderChange = (provider: ProviderPreset) => {
    // Build the whole next draft once. Spreading the stale `draft` per-field
    // would clobber earlier fields on the next onChange call.
    const preset = getPreset(provider)
    const next: ProfileDraft = { ...draft, provider }
    if (provider !== 'custom') {
      next.baseUrl = preset.baseUrl
      next.model = preset.defaultModel
      if (!nameEdited || !draft.name || draft.name === lastPresetName) {
        next.name = preset.label
        setLastPresetName(preset.label)
      }
    } else {
      setLastPresetName(null)
    }
    onChange(next)
    onPresetChange?.()
  }

  const onBaseUrlChange = (raw: string) => {
    const preset = getPreset(draft.provider)
    const next: ProfileDraft = { ...draft, baseUrl: raw }
    // If the user edits the base URL away from the preset's URL, switch to
    // Custom so the provider dropdown reflects the draft's provider.
    if (preset.id !== 'custom' && raw.trim().replace(/\/+$/, '') !== preset.baseUrl) {
      next.provider = 'custom'
    }
    onChange(next)
  }

  const onNameChange = (value: string) => {
    onChange({ ...draft, name: value })
    setNameEdited(true)
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
          onChange={(e) => onNameChange(e.target.value)}
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
          onChange={(e) => onBaseUrlChange(e.target.value)}
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
            onChange={(e) => onChange({ ...draft, apiKey: e.target.value })}
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
    </div>
  )
}