import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { APIProfile, AppState, PracticeState } from './types'

const LS_KEY = 'codeforge-ai:state'

/** Only these fields are written to localStorage. */
export type PersistedState = {
  profiles: APIProfile[]
  activeProfileId: string | null
  practice: PracticeState
}

/**
 * Merge persisted state back into the current store state. Older localStorage
 * shapes (missing `practice`, profiles without an `active` flag, or a null
  * active id pointing at a deleted profile) are normalised here so the app
  * never crashes on a stale record.
 */
export function mergePersisted(
  persisted: PersistedState,
  current: AppState,
): Partial<AppState> {
  const profiles = Array.isArray(persisted.profiles)
    ? persisted.profiles
        .filter((p): p is APIProfile => p && typeof p === 'object')
        .map((p) => ({
          id: typeof p.id === 'string' ? p.id : '',
          name: typeof p.name === 'string' ? p.name : 'Profile',
          provider: typeof p.provider === 'string' ? p.provider : 'custom',
          baseUrl: typeof p.baseUrl === 'string' ? p.baseUrl : '',
          apiKey: typeof p.apiKey === 'string' ? p.apiKey : '',
          model: typeof p.model === 'string' ? p.model : '',
          active: typeof p.active === 'boolean' ? p.active : false,
        }))
    : []
  const validIds = new Set(profiles.map((p) => p.id))
  const activeProfileId =
    persisted.activeProfileId && validIds.has(persisted.activeProfileId)
      ? persisted.activeProfileId
      : profiles.find((p) => p.active)?.id ?? null
  // Ensure the active profile is marked active=true after merge.
  if (activeProfileId) {
    profiles.forEach((p) => {
      p.active = p.id === activeProfileId
    })
  }
  return {
    profiles,
    activeProfileId,
    practice: persisted.practice ?? current.practice,
  }
}

const defaultPractice: PracticeState = {
  lastLanguage: 'python',
  paneSizes: { left: 42, right: 58 },
  editorHeight: { editor: 55, output: 45 },
  codeByQuestion: {},
}

const initialState: Omit<
  AppState,
  | 'setProfiles'
  | 'upsertProfile'
  | 'deleteProfile'
  | 'setActiveProfile'
  | 'setBurgerMenuOpen'
  | 'setApiKeyModalOpen'
  | 'setLanguage'
  | 'setPaneSizes'
  | 'setEditorHeight'
  | 'setCode'
> = {
  profiles: [],
  activeProfileId: null,
  ui: {
    burgerMenuOpen: false,
    apiKeyModalOpen: false,
  },
  practice: defaultPractice,
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,

      setProfiles: (profiles) => set({ profiles }),
      upsertProfile: (profile) =>
        set((state) => ({
          profiles: state.profiles
            .filter((p) => p.id !== profile.id)
            .concat(profile),
          activeProfileId: profile.active ? profile.id : state.activeProfileId,
        })),
      deleteProfile: (id) =>
        set((state) => {
          const next = state.profiles.filter((p) => p.id !== id)
          return {
            profiles: next,
            activeProfileId:
              state.activeProfileId === id
                ? (next.find((p) => p.active)?.id ?? null)
                : state.activeProfileId,
          }
        }),
      setActiveProfile: (id) =>
        set((state) => ({
          profiles: state.profiles.map((p) => ({ ...p, active: p.id === id })),
          activeProfileId: id,
        })),
      setBurgerMenuOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, burgerMenuOpen: open } })),
      setApiKeyModalOpen: (open) =>
        set((state) => ({ ui: { ...state.ui, apiKeyModalOpen: open } })),

      setLanguage: (language) =>
        set((state) => ({
          practice: { ...state.practice, lastLanguage: language },
        })),
      setPaneSizes: (sizes) =>
        set((state) => ({
          practice: { ...state.practice, paneSizes: sizes },
        })),
      setEditorHeight: (height) =>
        set((state) => ({
          practice: { ...state.practice, editorHeight: height },
        })),
      setCode: (questionId, language, code) =>
        set((state) => {
          const byLang = state.practice.codeByQuestion[questionId] ?? {}
          return {
            practice: {
              ...state.practice,
              codeByQuestion: {
                ...state.practice.codeByQuestion,
                [questionId]: { ...byLang, [language]: code },
              },
            },
          }
        }),
    }),
    {
      name: LS_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedState => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
        practice: state.practice,
      }),
      merge: (persisted, current) => ({
        ...(current as AppState),
        ...mergePersisted(persisted as PersistedState, current as AppState),
      }),
    },
  ),
)