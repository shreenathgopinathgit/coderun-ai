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
    },
  ),
)