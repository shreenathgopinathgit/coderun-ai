import type { RunResult } from '../runner/types'

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

/** One message in the Ask tab conversation. */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

/** The last run result, kept in the store so the Ask tab can include it in context. */
export interface LastRunState {
  result: RunResult | null
}

/** The Ask tab conversation state, persisted with a size cap. */
export interface ChatSessionState {
  messages: ChatMessage[]
  /** Whether the current question's code is included in the request context. */
  includeContext: boolean
  /** Approximate token count of the assembled context for the last request. */
  lastRequestTokens: number | null
  /** Approximate token count of the whole session context. */
  sessionTokens: number
}

export interface AppState {
  profiles: APIProfile[]
  activeProfileId: string | null
  ui: UIState
  practice: PracticeState
  chat: ChatSessionState
  lastRun: LastRunState

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

  setChatMessages: (messages: ChatMessage[]) => void
  appendChatMessage: (message: ChatMessage) => void
  clearChat: () => void
  setIncludeContext: (include: boolean) => void
  setChatTokenEstimate: (lastRequestTokens: number | null) => void
  setLastRun: (result: RunResult | null) => void
}