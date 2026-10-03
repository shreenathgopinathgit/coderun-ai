import { useState } from 'react'
import { useAppStore } from '../store/store'
import { getPreset } from '../store/providerPresets'
import type { APIProfile } from '../store/types'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { ProfileForm, type ProfileDraft } from './apikeys/ProfileForm'
import { ModelPicker } from './apikeys/ModelPicker'
import { ProfileList } from './apikeys/ProfileList'

const EMPTY_DRAFT: ProfileDraft = {
  name: '',
  provider: 'groq',
  baseUrl: getPreset('groq').baseUrl,
  apiKey: '',
  model: getPreset('groq').defaultModel,
}

function toProfile(draft: ProfileDraft, id?: string): APIProfile {
  return {
    id: id ?? crypto.randomUUID(),
    name: draft.name.trim() || 'Profile',
    provider: draft.provider,
    baseUrl: draft.baseUrl.trim(),
    apiKey: draft.apiKey,
    model: draft.model.trim(),
    active: false,
  }
}

export function ApiKeyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const profiles = useAppStore((s) => s.profiles)
  const activeId = useAppStore((s) => s.activeProfileId)
  const upsertProfile = useAppStore((s) => s.upsertProfile)
  const deleteProfile = useAppStore((s) => s.deleteProfile)
  const setActiveProfile = useAppStore((s) => s.setActiveProfile)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_DRAFT)
  const [error, setError] = useState<string | null>(null)
  const [wasOpen, setWasOpen] = useState(false)
  // Bumped on every preset change so the ModelPicker resets its fetched
  // model list and last test result.
  const [modelResetKey, setModelResetKey] = useState(0)

  // Reset the form when the modal transitions from closed to open. This is
  // the React-recommended "derive state during render" pattern, which avoids
  // calling setState inside an effect and the cascading renders it can cause.
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setDraft(EMPTY_DRAFT)
  }

  // The form key resets the controlled inputs whenever an edit starts,
  // instead of calling setState inside an effect.
  const formKey = editingId ?? 'new'

  const startEdit = (id: string) => {
    const p = profiles.find((x) => x.id === id)
    if (!p) return
    setEditingId(p.id)
    setDraft({
      name: p.name,
      provider: p.provider,
      baseUrl: p.baseUrl,
      apiKey: p.apiKey,
      model: p.model,
    })
    setError(null)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
    setError(null)
  }

  const save = () => {
    if (!draft.apiKey.trim()) {
      setError('An API key is required.')
      return
    }
    if (!draft.baseUrl.trim() || !draft.model.trim()) {
      setError('Base URL and model name are required.')
      return
    }
    const profile = toProfile(draft, editingId ?? undefined)
    upsertProfile(profile)
    setEditingId(null)
    setDraft(EMPTY_DRAFT)
    setError(null)
  }

  const remove = (id: string) => {
    deleteProfile(id)
    if (editingId === id) cancelEdit()
  }

  return (
    <Modal open={open} onClose={onClose} title="API Keys" width="680px">
      <div className="flex flex-col gap-5">
        <p className="text-xs text-[var(--color-text-dim)]">
          Keys are stored only in this browser&#39;s localStorage and are sent only to the
          provider you configure. Nothing is logged or sent anywhere else.
        </p>

        <ProfileList
          profiles={profiles}
          activeId={activeId}
          editingId={editingId}
          onEdit={startEdit}
          onDelete={remove}
          onActivate={(id) => setActiveProfile(id)}
        />

        <div className="border-t border-[var(--color-border)] pt-4">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--color-text-dim)]">
            {editingId ? 'Edit profile' : 'Add profile'}
          </h3>
          <div key={formKey} className="flex flex-col gap-4">
            <ProfileForm
              draft={draft}
              onChange={setDraft}
              onPresetChange={() => setModelResetKey((k) => k + 1)}
            />
            <ModelPicker
              key={modelResetKey}
              draft={draft}
              onModelChange={(model) => setDraft((d) => ({ ...d, model }))}
            />
            {error && (
              <p role="alert" className="text-xs text-[var(--color-error)]">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              {editingId && (
                <Button variant="secondary" size="sm" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
              <Button variant="primary" size="sm" onClick={save}>
                {editingId ? 'Save changes' : 'Add profile'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}