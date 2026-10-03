export type ProviderPreset =
  | 'groq'
  | 'openrouter'
  | 'gemini'
  | 'cerebras'
  | 'mistral'
  | 'custom'

export type Language =
  | 'python'
  | 'javascript'
  | 'typescript'
  | 'java'
  | 'c'
  | 'cpp'
  | 'go'
  | 'rust'

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

/** Left/right pane sizes as percentages of the practice page width (0..100). */
export interface PaneSizes {
  left: number
  right: number
}

/** Editor height as a percentage of the right pane (0..100). */
export interface EditorHeight {
  editor: number
  output: number
}

/** Code stored separately per question id and per language. */
export interface PracticeState {
  lastLanguage: Language
  paneSizes: PaneSizes
  editorHeight: EditorHeight
  codeByQuestion: Record<string, Record<Language, string>>
}

export interface AppState {
  profiles: APIProfile[]
  activeProfileId: string | null
  ui: UIState
  practice: PracticeState

  setProfiles: (profiles: APIProfile[]) => void
  upsertProfile: (profile: APIProfile) => void
  deleteProfile: (id: string) => void
  setActiveProfile: (id: string | null) => void
  setBurgerMenuOpen: (open: boolean) => void
  setApiKeyModalOpen: (open: boolean) => void

  setLanguage: (language: Language) => void
  setPaneSizes: (sizes: PaneSizes) => void
  setEditorHeight: (height: EditorHeight) => void
  setCode: (questionId: string, language: Language, code: string) => void
}