export type ProviderPreset =
  | 'groq'
  | 'openrouter'
  | 'gemini'
  | 'cerebras'
  | 'mistral'
  | 'custom'

export interface APIProfile {
  id: string
  name: string
  provider: ProviderPreset
  baseUrl: string
  apiKey: string
  model: string
  active: boolean
}

export interface UIState {
  burgerMenuOpen: boolean
  apiKeyModalOpen: boolean
}

export interface AppState {
  profiles: APIProfile[]
  activeProfileId: string | null
  ui: UIState

  setProfiles: (profiles: APIProfile[]) => void
  upsertProfile: (profile: APIProfile) => void
  deleteProfile: (id: string) => void
  setActiveProfile: (id: string | null) => void
  setBurgerMenuOpen: (open: boolean) => void
  setApiKeyModalOpen: (open: boolean) => void
}