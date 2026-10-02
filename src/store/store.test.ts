import { describe, it, expect, beforeEach } from 'vitest'
import { useAppStore } from './store'
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

describe('useAppStore', () => {
  beforeEach(() => {
    useAppStore.getState().setProfiles([])
    useAppStore.getState().setActiveProfile(null)
  })

  it('starts with no profiles', () => {
    expect(useAppStore.getState().profiles).toEqual([])
    expect(useAppStore.getState().activeProfileId).toBeNull()
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

  it('persists profiles and active id to localStorage', () => {
    useAppStore.getState().upsertProfile(profile({ id: 'p1', active: true }))
    const raw = localStorage.getItem('codeforge-ai:state')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.profiles).toHaveLength(1)
    expect(parsed.state.activeProfileId).toBe('p1')
  })

  it('setCode stores code per question and per language', () => {
    useAppStore.getState().setCode('q1', 'python', 'print(1)')
    useAppStore.getState().setCode('q1', 'javascript', 'console.log(1)')
    const s = useAppStore.getState()
    expect(s.practice.codeByQuestion.q1.python).toBe('print(1)')
    expect(s.practice.codeByQuestion.q1.javascript).toBe('console.log(1)')
    // Switching language does not lose work in the other language.
    expect(s.practice.codeByQuestion.q1.python).toBe('print(1)')
  })

  it('setCode keeps separate code per question', () => {
    useAppStore.getState().setCode('q1', 'python', 'a')
    useAppStore.getState().setCode('q2', 'python', 'b')
    const s = useAppStore.getState()
    expect(s.practice.codeByQuestion.q1.python).toBe('a')
    expect(s.practice.codeByQuestion.q2.python).toBe('b')
  })

  it('setPaneSizes persists to localStorage', () => {
    useAppStore.getState().setPaneSizes({ left: 30, right: 70 })
    const raw = localStorage.getItem('codeforge-ai:state')
    expect(raw).not.toBeNull()
    const parsed = JSON.parse(raw as string)
    expect(parsed.state.practice.paneSizes).toEqual({ left: 30, right: 70 })
  })
})