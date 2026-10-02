import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { APIProfile, AppState } from './types'

const LS_KEY = 'codeforge-ai:state'

/** Only these fields are written to localStorage. */
export type PersistedState = {
  profiles: APIProfile[]
  activeProfileId: string | null
}

const initialState: Omit<AppState, 'setProfiles' | 'upsertProfile' | 'deleteProfile' | 'setActiveProfile' | 'setBurgerMenuOpen' | 'setApiKeyModalOpen'> = {
  profiles: [],
  activeProfileId: null,
  ui: {
    burgerMenuOpen: false,
    apiKeyModalOpen: false,
  },
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
    }),
    {
      name: LS_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): PersistedState => ({
        profiles: state.profiles,
        activeProfileId: state.activeProfileId,
      }),
    },
  ),
)