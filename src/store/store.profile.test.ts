import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore, mergePersisted } from './store'
import type { APIProfile } from './types'

function profile(overrides: Partial<APIProfile> = {}): APIProfile {
  return {
    id: 'p1',
    name: 'Groq',
    provider: 'groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    apiKey: 'key',
    model: 'llama-3.3-70b-versatile',
    active: false,
    ...overrides,
  }
}

describe('profile actions', () => {
  beforeEach(() => {
    useAppStore.getState().setProfiles([])
    useAppStore.getState().setActiveProfile(null)
  })

  it('upserts a profile and marks it active', () => {
    useAppStore.getState().upsertProfile(profile({ active: true }))
    const s = useAppStore.getState()
    expect(s.profiles).toHaveLength(1)
    expect(s.activeProfileId).toBe('p1')
    expect(s.profiles[0].active).toBe(true)
  })

  it('upsert replaces an existing profile by id', () => {
    useAppStore.getState().upsertProfile(profile({ name: 'Groq' }))
    useAppStore.getState().upsertProfile(profile({ name: 'Groq v2', model: 'llama-3.1-8b' }))
    const s = useAppStore.getState()
    expect(s.profiles).toHaveLength(1)
    expect(s.profiles[0].name).toBe('Groq v2')
  })

  it('deletes a profile and clears active when deleted', () => {
    useAppStore.getState().upsertProfile(profile({ active: true }))
    useAppStore.getState().deleteProfile('p1')
    const s = useAppStore.getState()
    expect(s.profiles).toHaveLength(0)
    expect(s.activeProfileId).toBeNull()
  })

  it('deleting a non-active profile keeps the active one', () => {
    useAppStore.getState().upsertProfile(profile({ id: 'p1', active: true }))
    useAppStore.getState().upsertProfile(profile({ id: 'p2' }))
    useAppStore.getState().deleteProfile('p2')
    const s = useAppStore.getState()
    expect(s.profiles).toHaveLength(1)
    expect(s.activeProfileId).toBe('p1')
  })

  it('setActiveProfile toggles exactly one active profile', () => {
    useAppStore.getState().upsertProfile(profile({ id: 'p1' }))
    useAppStore.getState().upsertProfile(profile({ id: 'p2' }))
    useAppStore.getState().setActiveProfile('p2')
    const s = useAppStore.getState()
    expect(s.profiles.filter((p) => p.active)).toEqual([s.profiles[1]])
    expect(s.activeProfileId).toBe('p2')
  })

  it('switching the active profile takes effect immediately', () => {
    useAppStore.getState().upsertProfile(profile({ id: 'p1' }))
    useAppStore.getState().upsertProfile(profile({ id: 'p2' }))
    useAppStore.getState().setActiveProfile('p1')
    expect(useAppStore.getState().activeProfileId).toBe('p1')
    useAppStore.getState().setActiveProfile('p2')
    expect(useAppStore.getState().activeProfileId).toBe('p2')
    expect(useAppStore.getState().profiles.filter((p) => p.active)).toHaveLength(1)
  })

  it('upsert with active true promotes that profile', () => {
    useAppStore.getState().upsertProfile(profile({ id: 'p1' }))
    useAppStore.getState().upsertProfile(profile({ id: 'p2', active: true }))
    const s = useAppStore.getState()
    expect(s.activeProfileId).toBe('p2')
    expect(s.profiles.find((p) => p.id === 'p1')?.active).toBe(false)
  })
})

describe('mergePersisted', () => {
  it('normalises a profile missing the active flag', () => {
    const current = useAppStore.getState()
    const merged = mergePersisted(
      {
        profiles: [{ id: 'p1', name: 'Old', provider: 'custom', baseUrl: 'https://x', apiKey: 'k', model: 'm' } as APIProfile],
        activeProfileId: 'p1',
        practice: current.practice,
        chat: current.chat,
        lastRun: current.lastRun,
      },
      current,
    )
    expect(merged.profiles).toBeDefined()
    expect(merged.profiles![0].active).toBe(true)
    expect(merged.activeProfileId).toBe('p1')
  })

  it('falls back to the first active profile when the stored id is gone', () => {
    const current = useAppStore.getState()
    const merged = mergePersisted(
      {
        profiles: [
          { id: 'p1', name: 'A', provider: 'custom', baseUrl: 'https://a', apiKey: 'k', model: 'm', active: true } as APIProfile,
          { id: 'p2', name: 'B', provider: 'custom', baseUrl: 'https://b', apiKey: 'k', model: 'm', active: false } as APIProfile,
        ],
        activeProfileId: 'gone',
        practice: current.practice,
        chat: current.chat,
        lastRun: current.lastRun,
      },
      current,
    )
    expect(merged.activeProfileId).toBe('p1')
  })

  it('drops non-object entries and keeps practice from the stored state', () => {
    const current = useAppStore.getState()
    const merged = mergePersisted(
      {
        profiles: [
          null,
          undefined,
          'x',
          { id: 'p1', name: 'A', provider: 'custom', baseUrl: 'https://a', apiKey: 'k', model: 'm' } as APIProfile,
        ] as unknown as APIProfile[],
        activeProfileId: 'p1',
        practice: { lastLanguage: 'python', paneSizes: { left: 30, right: 70 }, editorHeight: { editor: 50, output: 50 }, codeByQuestion: {} },
        chat: current.chat,
        lastRun: current.lastRun,
      },
      current,
    )
    expect(merged.profiles).toBeDefined()
    expect(merged.profiles!.length).toBe(1)
    expect(merged.practice?.lastLanguage).toBe('python')
  })
})